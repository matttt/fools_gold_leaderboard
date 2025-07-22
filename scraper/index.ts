import "dotenv/config";
import {
  VideoName,
  VideoNames,
  videoUrls,
  VideoPlatform,
} from "./videoUrls.ts";
import { ApifyClient } from "apify-client";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { scrapeReelViewCount } from "./lib/scrapeReels.ts";
// import { MongoClient, ServerApiVersion } from 'mongodb';

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: process.env.APIFY_API_KEY || "",
});

const getUrlToVideoNameMapForPlatform = (platform: VideoPlatform) => {
  const urlToVideoNameMap: Record<string, VideoName> = {};
  for (const videoName of VideoNames) {
    if (videoUrls[videoName][platform]) {
      urlToVideoNameMap[videoUrls[videoName][platform]] = videoName;
    }
  }
  return urlToVideoNameMap;
};

const getBlankViewcountOutputMap = () => {
  const out: Partial<Record<VideoName, number | null>> = {};
  for (const videoName of VideoNames) {
    out[videoName] = null; // initialize with null
  }
  return out;
};

// this actor stopped working
// it was nice since it accepted a list of urls rather than n posts from a given username like the new one
// const scrapeReels = async () => {
//   // first let's build a map of videoName to reel url
//   const urlMap = getUrlToVideoNameMapForPlatform(VideoPlatform.Reels);
//   const input = {
//     urls: Object.keys(urlMap),
//   };

//   const out = getBlankViewcountOutputMap();

//   // Run the Actor and wait for it to finish
//   const run = await client.actor("eOGkg9FOOI8vgsSFB").call(input);

//   // Fetch and print Actor results from the run's dataset (if any)
//   const { items } = await client.dataset(run.defaultDatasetId).listItems();
//   for (const item of items) {
//     const { input, video_play_count, url } = item;
//     console.log(`${url}: ${video_play_count}`, urlMap[url]);

//     if (!url || url === "undefined") continue;
//     out[urlMap[url]] = video_play_count;
//   }

//   return out;
// };

const scrapeReels = async (cookiesJsonStr: string) => {
  // for reels, we're using the homegrown scraper 

  // first let's build a map of videoName to reel id
  // we need to pull the reel ids from the urls

  const urlMap = getUrlToVideoNameMapForPlatform(VideoPlatform.Reels);
  const reelIds = Object.keys(urlMap).map((url) => {
    const parts = url.split("/");
    return parts[parts.length - 2]; // the second to last part is the reel id
  });


  // map of reel id to view count
  const results = await scrapeReelViewCount(reelIds, {cookiesJsonStr})

  if (!results) {
    console.error("Failed to scrape reel view counts");
    return getBlankViewcountOutputMap();
  }

  const out = getBlankViewcountOutputMap();

  const urls = Object.keys(urlMap);
  for (const [reelId, viewCount] of Object.entries(results)) {
    const key = urls.find((url) => url.includes(reelId));

    if (!key || key === "undefined") {
      console.warn(`No URL found for reelId: ${reelId}`);
      continue;
    }

    console.log(`${key}: ${viewCount}`, urlMap[key]);

    out[urlMap[key]] = viewCount || null; // assign the view count or null if not available

  }
  
  return out;

}

// replacing the Apify scraper with the 1st party youtube data api
// const scrapeYTShorts = async () => {
//   const urlMap = getUrlToVideoNameMapForPlatform(VideoPlatform.Youtube);

//   const urlObjs = Object.keys(urlMap).map((url) => ({
//     url,
//     method: "GET",
//   }));

//   const input = {
//     startUrls: urlObjs,
//   };

//   const out = getBlankViewcountOutputMap();

//   // Run the Actor and wait for it to finish
//   const run = await client.actor("h7sDV53CddomktSi5").call(input);

//   // Fetch and print Actor results from the run's dataset (if any)
//   console.log("Results from dataset");
//   const { items } = await client.dataset(run.defaultDatasetId).listItems();
//   items.forEach((item) => {
//     console.log(`${item.url}: ${item.viewCount}`, urlMap[item.url]);
//     if (!item.url || item.url === "undefined") return;
//     out[urlMap[item.url]] = item.viewCount;
//   });
//   return out;
// };

const getShortsIdFromURL = (url: string): string | null => {
  const match = url.match(/youtube\.com\/shorts\/([^\/?&]+)/);
  return match ? match[1] : null;
}

const scrapeYTShorts = async () => {
  const urlMap = getUrlToVideoNameMapForPlatform(VideoPlatform.Youtube);

  const urls = Object.keys(urlMap);

  // extract the video IDs from the URLs
  const videoIds = urls
    .map(getShortsIdFromURL)
    .filter((id): id is string => id !== null); // filter out nulls

  const params = new URLSearchParams({
    part: "statistics",
    id: videoIds.join(","),
    key: process.env.YOUTUBE_API_KEY || "",
  });
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
  );
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const out = getBlankViewcountOutputMap();



  for (const item of data.items) {
    const key = urls.find((url) => url.includes(item.id));
    if (!key || key === "undefined") {
      console.warn(`No URL found for video ID: ${item.id}`);
      continue;
    }
    console.log(`${key}: ${item.statistics.viewCount}`, urlMap[key]);
    if (!urlMap[key]) {
      console.warn(`No video name found for URL: ${key}`);
      continue;
    }

    out[urlMap[key]] = parseInt(item.statistics.viewCount, 10) || null; // assign the view count or null if not available
  }

  return out;
}

const scrapeTikToks = async () => {
  // first let's build a map of videoName to reel url
  const urlMap = getUrlToVideoNameMapForPlatform(VideoPlatform.Tiktok);
  const input = {
    postURLs: Object.keys(urlMap),
  };

  const out = getBlankViewcountOutputMap();

  // Run the Actor and wait for it to finish
  const run = await client.actor("GdWCkxBtKWOsKjdch").call(input);

  // Fetch and print Actor results from the run's dataset (if any)
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  for (const item of items) {
    const { input, playCount, webVideoUrl } = item;
    console.log(`${webVideoUrl}: ${playCount}`, urlMap[webVideoUrl]);

    if (!webVideoUrl || webVideoUrl === "undefined") continue;
    out[urlMap[webVideoUrl]] = playCount;
  }

  return out;
};

interface VideoViewCounts {
  youtube: number | null;
  tiktok: number | null;
  reels: number | null;
}

type ScrapeJobOutput = Partial<Record<VideoName, VideoViewCounts>>;

const runScrapeJob = async (igCookiesJSON: string) => {
  const output: ScrapeJobOutput = {};

  for (const videoName of VideoNames) {
    output[videoName] = {
      youtube: null,
      tiktok: null,
      reels: null,
    };
  }

  const applyResultsToOutput = (
    results: Partial<Record<VideoName, number | null>>,
    platform: VideoPlatform
  ) => {
    for (const videoName of VideoNames) {
      if (results[videoName] !== null) {
        if (!output[videoName]) continue;

        output[videoName][platform] = results[videoName] || null;
      }
    }
  };

  // these all return maps of VideoName to viewcount
  const [reelResults, ytResults, tiktokResults] = await Promise.all([
    scrapeReels(igCookiesJSON),
    scrapeYTShorts(),
    scrapeTikToks(),
  ]);

  applyResultsToOutput(reelResults, VideoPlatform.Reels);
  applyResultsToOutput(ytResults, VideoPlatform.Youtube);
  applyResultsToOutput(tiktokResults, VideoPlatform.Tiktok);

  // just do youtube (its quick for testing)
  // const ytResults = await scrapeYTShorts();
  // applyResultsToOutput(ytResults, VideoPlatform.Youtube);

  console.dir(output, { depth: 4, colors: true });

  return output;
};

const mongoClient = new MongoClient(
  process.env.MONGODB_CONNECTION_STRING || "",
  {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  }
);

async function run() {
  try {
    const client = await mongoClient.connect();

    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const db = client.db("foolsGoldLeaderboard");


    const viewCountsCollection = db.collection("viewCounts");
    const cookiesCollection = db.collection("cookies");

    const cookiesObj = await cookiesCollection.findOne({ _id: new ObjectId("687edc8a3ff403a7b91729bd") });
    
    if (!cookiesObj) {
      console.error("No cookies found in the database. Please run the getInstagramLoginCookies script first.");
      return;
    }

    const scrapeResults = await runScrapeJob(cookiesObj.json);
    
    // optionally: if you want documents to auto-expire after e.g. 7 days
    await viewCountsCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 7 * 24 * 60 * 60 }
    );

    // Insert the scrape results into the collection
    if (!process.argv.includes("--noop")) {
      const result = await viewCountsCollection.insertOne({
        viewCounts: scrapeResults,
        createdAt: new Date(),
      });
      console.log("Inserted document:", result.insertedId);
    } else {
      console.log("Noop mode enabled – skipping insert.");
    }
  } finally {
    // Ensures that the client will close when you finish/error
    await mongoClient.close();
  }
}
run().catch(console.dir);

// entry to put into db
// const data = {
//   timestamp: new Date().toISOString(),
//   viewCounts: {
//     [VideoName.PeelRobalino]: {
//       youtube: 0,
//       tiktok: 0,
//       reels: 0,
//     },
//   }
// }
