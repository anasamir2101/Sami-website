<?php
header("Access-Control-Allow-Origin: *");
$rss = file_get_contents('https://www.capecodchamber.org/event/rss/');
echo $rss;
?>
