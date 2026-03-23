import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    await db.command({ ping: 1 });

    const collections = await db
      .listCollections({}, { nameOnly: true })
      .toArray();

    return NextResponse.json({
      ok: true,
      dbName: db.databaseName,
      collections: collections.map((collection) => collection.name),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
