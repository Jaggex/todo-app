import { MongoClient } from "mongodb";

declare global {
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

function getMongoConfig() {
  const mongoUri = process.env.MONGODB_URI;
  const mongoDbName = process.env.MONGODB_DB_NAME;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!mongoDbName) {
    throw new Error("MONGODB_DB_NAME is not set");
  }

  return { mongoUri, mongoDbName };
}

export function getMongoClientPromise() {
  if (!global.__mongoClientPromise__) {
    const { mongoUri } = getMongoConfig();
    global.__mongoClientPromise__ = new MongoClient(mongoUri).connect();
  }

  return global.__mongoClientPromise__;
}

export { getMongoClientPromise as clientPromise };

export async function getDb() {
  const { mongoDbName } = getMongoConfig();
  const connectedClient = await getMongoClientPromise();
  return connectedClient.db(mongoDbName);
}
