import "dotenv/config";
import puppeteer, { Browser, Page, ElementHandle } from "puppeteer";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const repeat = async (fn: () => Promise<void>, times: number) => {
  for (let i = 0; i < times; i++) {
    await fn();
  }
};

const parseAbbrevNumber = (str: string): number | null => {
  const match = str
    .trim()
    // capture a decimal number, optionally followed by K/M/B/T
    .match(/^([\d.,]+)\s*([KMBT])?$/i);
  if (!match) return null;

  // 1) strip commas from the numeric part
  let value = parseFloat(match[1].replace(/,/g, ""));
  if (isNaN(value)) return null;

  // 2) apply multiplier if there’s a suffix
  switch (match[2]?.toUpperCase()) {
    case "K":
      value *= 1e3;
      break;
    case "M":
      value *= 1e6;
      break;
    case "B":
      value *= 1e9;
      break;
    case "T":
      value *= 1e12;
      break;
  }
  return value;
};

async function getReelViewCountElement(
  page: Page,
  reelId: string
): Promise<ElementHandle<Element> | null> {
  const selector = `[href="/gamechangershow/reel/${reelId}/"] div:has(> svg[aria-label="View Count Icon"])`;

  await page.waitForSelector(selector, { timeout: 250 }).catch(() => null);
  const handle = await page.$(selector);
  if (!handle) return null;


  const parent = (await handle.evaluateHandle(
    (el) => el.parentElement
  )) as ElementHandle<Element>;

  return parent.$("span > span");
}

export async function scrapeReelViewCount(
  reelIds: string[],
  options: {
    scrollTimes?: number;
    cookiesJsonStr?: string;
  } = {}
): Promise<Record<string, number | null> | null> {
  const { scrollTimes = 15, cookiesJsonStr = process.env.COOKIES || "" } =
    options;
  const bakedCookies = JSON.parse(cookiesJsonStr);

  const browser: Browser = await puppeteer.launch({ headless: true });
  const page: Page = await browser.newPage();

  if (bakedCookies.length) {
    await page.setCookie(...bakedCookies);
  }

  await page.goto("https://www.instagram.com/gamechangershow/reels/", {
    waitUntil: "networkidle2",
  });
  await page.setViewport({ width: 1080, height: 1024 });
  await sleep(3000);

  const viewCounts: Record<string, number | null> = {};

  // this is entirely bonkers, but basically we're scrolling down the page,
  // and in between each scroll we're looking for each reel we havent scraped yet
  
  // this madness is because IG unmounts the reel elements when they are not in the viewport,
  await repeat(async () => {
    // map of reelId to view count
    for (const reelId of reelIds) {
      if (viewCounts[reelId]) continue;

      const viewCountHandle = await getReelViewCountElement(page, reelId);
      let viewCount: string | null = null;

      if (viewCountHandle) {
        const rawValue = await page.evaluate(
          (el) => el.textContent,
          viewCountHandle
        );

        if (!rawValue) {
          viewCounts[reelId] = null;
          continue;
        }
        viewCounts[reelId] = parseAbbrevNumber(rawValue) || null;
      } else {
        viewCounts[reelId] = null;
        continue;
      }
    }

    await page.evaluate(() => window.scrollBy(0, 1000));
    await sleep(500);
  }, scrollTimes);

  await browser.close();
  return viewCounts;
}
