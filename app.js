const express = require('express');
const axios = require('axios');
const parseString = require('xml2js').parseString;
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
// Connect to SQLite database
const db = new sqlite3.Database('events.db');

// Create events table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    title TEXT UNIQUE,
    link TEXT,
    category TEXT,
    guid TEXT,
    pubDate TEXT,
    description TEXT
  )
`);

app.get('/events', (req, res) => {
  axios.get('http://www.capecodchamber.org/event/rss/')
  .then(response => {
    const xmlData = response.data;

    parseString(xmlData, (err, result) => {
      if (err) {
        console.error('Error parsing XML: ', err);
        return;
      }

      const channel = result.rss.channel[0];

      // Extract information from each item
      channel.item.forEach(item => {
        const title = item.title[0];
        const link = item.link[0];
        const category = item.category[0];
        const guid = item.guid[0]._;
        const pubDate = item.pubDate[0];
        const descriptionHtml = item.description[0];

        // Load the HTML content using Cheerio
        const $ = cheerio.load(descriptionHtml);

        // Get the updated description HTML
        const updatedDescriptionHtml = $('p').text().trim();

        // Insert data into SQLite database
        db.get('SELECT id FROM events WHERE title = ?', [title], (err, existingRow) => {
          if (err) {
            console.error('Error checking for existing row: ', err);
            return;
          }
        
          if (existingRow) {
            // If a row with the same title exists, update it
            db.run(
              'UPDATE events SET link = ?, category = ?, guid = ?, pubDate = ?, description = ? WHERE title = ?',
              [link, category, guid, pubDate, updatedDescriptionHtml, title],
              (err) => {
                if (err) {
                  console.error('Error updating data in the database: ', err);
                }
              }
            );
          } else {
            // If no row with the same title exists, insert a new row
            db.run(
              'INSERT INTO events (title, link, category, guid, pubDate, description) VALUES (?, ?, ?, ?, ?, ?)',
              [title, link, category, guid, pubDate, updatedDescriptionHtml],
              (err) => {
                if (err) {
                  console.error('Error inserting data into database: ', err);
                }
              }
            );
          }
        });
      });
    });
  })
  .catch(error => {
    console.error('Error fetching the XML: ', error);
  });

  // Retrieve all events from the database
  db.all('SELECT * FROM events', (err, rows) => {
    if (err) {
      console.error('Error retrieving events from the database: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(rows);
  });
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
