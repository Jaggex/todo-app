import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME;

if (!mongoUri) {
  throw new Error("MONGODB_URI is not set");
}

if (!mongoDbName) {
  throw new Error("MONGODB_DB_NAME is not set");
}

declare global {
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

const client = new MongoClient(mongoUri);
const clientPromise = global.__mongoClientPromise__ ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  global.__mongoClientPromise__ = clientPromise;
}

export { clientPromise };

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(mongoDbName);
}
