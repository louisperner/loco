import React, { useState } from 'react';
import axios from 'axios';
import cheerio from 'cheerio';

function Scrap() {
  const [titles, setTitles] = useState([]);
  const [error, setError] = useState(null);

  const scrapeWebsite = async () => {
    try {
      // Example URL; replace with the actual URL you want to scrape
      const response = await axios.get('https://nodejs.org');
      const html = response.data;
      const $ = cheerio.load(html);
      let scrapedTitles = [];

      $('h1').each((index, element) => {
        scrapedTitles.push($(element).text());
      });

      setTitles(scrapedTitles);
    } catch (err) {
      console.error('Error scraping website:', err);
      setError('Failed to scrape the website');
    }
  };

  return (
    <div>
      <h1>Web Scraper</h1>
      <button onClick={scrapeWebsite}>Scrape Website</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {titles.map((title, index) => (
          <li key={index}>{title}</li>
        ))}
      </ul>
    </div>
  );
}

export default Scrap;
