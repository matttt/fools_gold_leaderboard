#!/usr/bin/env tsx

import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";
import { readFileSync } from "fs";
import { resolve } from "path";

if (process.argv.length < 3) {
  console.error("Usage: tsx importHistorical.tsx <path/to/friend.json>");
  process.exit(1);
}

const MONGO_URI = process.env.MONGODB_CONNECTION_STRING;
if (!MONGO_URI) {
  console.error("❌ Set MONGODB_CONNECTION_STRING in your env");
  process.exit(1);
}

// from old to new
const videoNameMap = {
  "peel-robalino": "peel_robalino",
  "annas-king": "annas_king_for_a_day",
  "katies-d20": "katies_d20_on_a_bus",
  "erikas-haircut": "erikas_haircut",
  "sephies-car-wash": "sephies_sexy_car_wash",
  "grants-crack": "grants_crack",
  "jonnys-puppy-bowl": "jonnys_human_puppy_bowl",
  "lily-izzys-milk": "lily_and_izzys_milk_taste_test",
  "izzys-buttholes": "izzys_buttholes",
  "vics-brennans-exit": "vics_brennans_exit_video",
};

async function main() {
  const filePath = resolve(process.argv[2]);
  const raw = readFileSync(filePath, "utf-8");
  const {
    times,
    videos,
  }: {
    times: string[];
    videos: Record<
      string,
      {
        youtube: number[];
        tiktok: number[];
        instagram: number[];
      }
    >;
  } = JSON.parse(raw);

  // Sanity check
  const count = times.length;
  for (const [vid, data] of Object.entries(videos)) {
    if (
      data.youtube.length !== count ||
      data.tiktok.length !== count ||
      data.instagram.length !== count
    ) {
      console.error(`❌ Mismatched lengths for "${vid}"`);
      process.exit(1);
    }
  }

  const client = new MongoClient(MONGO_URI || "", {
    serverApi: ServerApiVersion.v1,
  });
  await client.connect();
  const db = client.db("foolsGoldLeaderboard");
  const coll = db.collection("viewCounts");

  // Build docs
  const docs = times
    .map((t, idx) => {
      if (idx === 0) return;

      const createdAt = new Date(t);
      const viewCounts: Record<
        string,
        { youtube: number; tiktok: number; reels: number }
      > = {};

      for (const [vid, data] of Object.entries(videos)) {
        // Convert old video names to new ones
        if (!(vid in videoNameMap)) {
          console.error(`❌ Unknown video name: "${vid}"`);
          process.exit(1);
        }
        const newVid = videoNameMap[vid as keyof typeof videoNameMap]; // use the new name if it exists

        // Add the view counts for this video

        viewCounts[newVid] = {
          youtube: data.youtube[idx],
          tiktok: data.tiktok[idx],
          reels: data.instagram[idx], // rename “instagram” → “reels”
        };
      }

      return { viewCounts, createdAt };
    })
    .filter((doc) => doc !== undefined); // filter out the first entry which is undefined. im dumb

  console.dir(docs, { depth: 4, colors: true });

  // Insert all at once
  const result = await coll.insertMany(docs);
  console.log(`✅ Inserted ${result.insertedCount} documents.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
