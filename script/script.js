
  const Url = 'http://localhost:3000/events';
  
  async function fetchAndDisplayRss() {
    try {
      const res = await fetch(Url);
      const data = await res.json();
      displayFeeds(data);
    } catch (error) {
      console.error('Error fetching RSS data:', error);
    }
  }

  function displayFeeds(items) {
    const cardContainer = document.getElementById('cardContainer');
    const selectedCategory = document.getElementById('categoryFilter').value;

    items.forEach(item => {
      if (selectedCategory === '' || item.category === selectedCategory) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <h3>${item.title}</h3>
          <p>${item.pubDate}</p>
          <a href="${item.link}">Read More</a>
        `;
        cardContainer.appendChild(card);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayRss();
  });

  document.getElementById('categoryFilter').addEventListener('change', () => {
    document.getElementById('cardContainer').innerHTML = '';
    fetchAndDisplayRss();
  });
