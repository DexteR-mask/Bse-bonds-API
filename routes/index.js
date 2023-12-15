const express = require("express");
const router = express.Router();
const cheerio = require("cheerio");
const fs = require('fs').promises; 

let baseUrl=`https://api.bseindia.com/BseIndiaAPI/api`

let headers = {
  headers: {
    Referer: "https://www.bseindia.com/",
  },
};
baseUrls = [
  `${baseUrl}/StockReachGraph/w?flag=0&fromdate=&todate=&seriesid=`,
  `${baseUrl}/DebSecurityInfo/w?`,
  `${baseUrl}/getScripHeaderData/w?Debtflag=&seriesid=`,
  `${baseUrl}/ComHeader/w?quotetype=EQ&seriesid=`,
  `${baseUrl}/DebStockTrading/w?`,
  `${baseUrl}/PriceBand/w?`,
  `${baseUrl}/DebtWeekHighLow/w?`,
  `${baseUrl}/DebVarMargin/w?`,
  `${baseUrl}/DebMarketDepth/w?`,
  `${baseUrl}/DebSDP/w?`,
  `${baseUrl}/HighLow/w?Type=EQ&flag=C`,
];

async function fetchData(url) {
  try {
    const response = await fetch(url, headers);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}: ${error.message}`);
    return error;
  }
}

router.get("/make-data", async function (req, res, next) {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/DexteR-mask/scripCodes/main/SecurityCode.json`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch scrip codes');
    }
    const scripCodes = await response.json();
    const delayBetweenRequests = 0; // 0.5 seconds
    const batchSize = 10; // Number of requests before writing to the file

    let existingData = {};
    try {
      const data = await fs.readFile('fetchedData.json', 'utf8');
      existingData = JSON.parse(data);
    } catch (error) {
      // Ignore if the file doesn't exist yet
    }

    for (let i = 0; i < scripCodes.SecurityCode.length; i++) {
      const SC = scripCodes.SecurityCode[i];

      // Check if the code has already been fetched
      if (existingData[SC]) {
        console.log(`Skipping already fetched code: ${SC}`);
        continue;
      }

      const urls = baseUrls.map((baseUrl) => `${baseUrl}&scripcode=${SC}`);
      const dataPromises = urls.map(fetchData);
      const responseData = await Promise.all(dataPromises);

      // Save data to existingData object with SC as the key
      existingData[SC] = responseData;

      console.log(`Fetched data for code: ${SC}`);

      // Write to the file after every batchSize requests
      if ((i + 1) % batchSize === 0 || i === scripCodes.SecurityCode.length - 1) {
        await fs.writeFile('fetchedData.json', JSON.stringify(existingData, null, 2), 'utf8');
        console.log(`Data has been written to file`);
      }

      // Add delay between requests
    
    }

    res.send(`Data has been fetched and saved`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
