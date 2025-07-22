import "dotenv/config";
import Fastify from "fastify";
import { MongoClient, ServerApiVersion } from "mongodb";

const fastify = Fastify({ logger: true });
const MONGO_URI = process.env.MONGODB_CONNECTION_STRING || "";
const PORT = Number(process.env.PORT || 3000);

let viewCountsColl: any;

// 1. Connect to Mongo on startup
fastify.addHook("onReady", async () => {
  const client = new MongoClient(MONGO_URI, {
    serverApi: { version: ServerApiVersion.v1 },
  });
  await client.connect();
  const db = client.db("foolsGoldLeaderboard");
  viewCountsColl = db.collection("viewCounts");
});

// 2. GET /viewcounts → latest document’s viewCounts
fastify.get("/viewcounts", async (req, reply) => {
  const docs = await viewCountsColl
    .find({}, { sort: { createdAt: -1 } })
    .toArray();

  if (docs.length === 0) {
    return reply.code(404).send({ error: "No data found" });
  }

  return docs.map((doc: any) => ({
    viewCounts: doc.viewCounts,
    fetchedAt: doc.createdAt,
  }));
});

fastify.get("/viewcounts/latest", async (req, reply) => {
  const doc = await viewCountsColl.findOne(
    {},
    { sort: { createdAt: -1 } } // ← descending by createdAt
  );
  if (!doc) {
    return reply.code(404).send({ error: "No data found" });
  }
  return {
    viewCounts: doc.viewCounts,
    fetchedAt: doc.createdAt,
  };
});

  fastify.get('/viewcounts/flattened', async (req, reply) => {
    // load all historical docs in ascending time order
    const docs = await viewCountsColl
      .find({}, { sort: { createdAt: 1 } })
      .toArray();

    if (docs.length === 0) {
      return reply.code(404).send({ error: 'No data found' });
    }

    // build the times array
    const times = docs.map((doc) => doc.createdAt.toISOString());

    // initialize a structure for each video key
    const videos: Record<string, {
      youtube: number[];
      tiktok: number[];
      instagram: number[];
    }> = {};

    // iterate through each snapshot
    for (const doc of docs) {
      for (const [rawKey, counts] of Object.entries(doc.viewCounts)) {
        // convert underscore naming to dashed naming
        const key = rawKey.replace(/_/g, '-');
        if (!videos[key]) {
          videos[key] = { youtube: [], tiktok: [], instagram: [] };
        }
        videos[key].youtube.push(counts.youtube);
        videos[key].tiktok.push(counts.tiktok);
        // original data uses "reels" for Instagram counts
        videos[key].instagram.push(counts.reels ?? counts.instagram ?? 0);
      }
    }

    return { times, videos };
  });

// 3. Graceful shutdown
fastify.addHook("onClose", async () => {
  // MongoClient.close() automatically called by Bun on process exit,
  // but you could keep a reference to client and call client.close() here.
});

// 4. Start server
fastify
  .listen({ port: PORT, host: "0.0.0.0" })
  .then(() =>
    fastify.log.info(`🚀 Server listening on http://localhost:${PORT}`)
  );
