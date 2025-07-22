// run this locally, then minify the results of cookies.json (created in this dir) 

import "dotenv/config";
import puppeteer from "puppeteer-core";
import fs from "fs";
const browser = await puppeteer.launch({
  headless: true,
});
const page = await browser.newPage();

// Navigate the page to a URL.
await page.goto("https://www.instagram.com");

// Set screen size.
await page.setViewport({ width: 1080, height: 1024 });

// sign in within 30 seconds!!

setTimeout(async () => {
  const cookies = await page.cookies();

  fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
}, 30000);
