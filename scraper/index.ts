import "dotenv/config";
import {
  VideoName,
  VideoNames,
  videoUrls,
  VideoPlatform,
} from "./videoUrls.ts";
import { ApifyClient } from "apify-client";
import { MongoClient, ServerApiVersion } from "mongodb";
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
const scrapeReels = async () => {
  // first let's build a map of videoName to reel url
  const urlMap = getUrlToVideoNameMapForPlatform(VideoPlatform.Reels);
  const input = {
    urls: Object.keys(urlMap),
  };

  const out = getBlankViewcountOutputMap();

  // Run the Actor and wait for it to finish
  const run = await client.actor("eOGkg9FOOI8vgsSFB").call(input);

  // Fetch and print Actor results from the run's dataset (if any)
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  for (const item of items) {
    const { input, video_play_count, url } = item;
    console.log(`${url}: ${video_play_count}`, urlMap[url]);

    if (!url || url === "undefined") continue;
    out[urlMap[url]] = video_play_count;
  }

  return out;
};

const scrapeYTShorts = async () => {
  const urlMap = getUrlToVideoNameMapForPlatform(VideoPlatform.Youtube);

  const urlObjs = Object.keys(urlMap).map((url) => ({
    url,
    method: "GET",
  }));

  const input = {
    startUrls: urlObjs,
  };

  const out = getBlankViewcountOutputMap();

  // Run the Actor and wait for it to finish
  const run = await client.actor("h7sDV53CddomktSi5").call(input);

  // Fetch and print Actor results from the run's dataset (if any)
  console.log("Results from dataset");
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  items.forEach((item) => {
    console.log(`${item.url}: ${item.viewCount}`, urlMap[item.url]);
    if (!item.url || item.url === "undefined") return;
    out[urlMap[item.url]] = item.viewCount;
  });
  return out;
};

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

const runScrapeJob = async () => {
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
    scrapeReels(),
    scrapeYTShorts(),
    scrapeTikToks(),
  ]);

  applyResultsToOutput(reelResults, VideoPlatform.Reels);
  applyResultsToOutput(ytResults, VideoPlatform.Youtube);
  applyResultsToOutput(tiktokResults, VideoPlatform.Tiktok);

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
    const [client, scrapeResults] = await Promise.all([
      mongoClient.connect(),
      runScrapeJob(),
    ]);
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const db = client.db("foolsGoldLeaderboard");
    const collection = db.collection("viewCounts");

    // optionally: if you want documents to auto-expire after e.g. 7 days
    await collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 7 * 24 * 60 * 60 }
    );

    // Insert the scrape results into the collection
    const result = await collection.insertOne({
      viewCounts: scrapeResults,
      createdAt: new Date(),
    });
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
