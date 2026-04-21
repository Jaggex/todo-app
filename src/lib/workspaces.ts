import { randomBytes } from "node:crypto";

import { ObjectId, type Collection, type WithId } from "mongodb";

import { getDb } from "@/lib/mongodb";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkspaceMemberRole = "owner" | "member";

export type Workspace = {
  id: string;
  name: string;
  createdBy: string; // userId
  createdAt: Date;
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
  joinedAt: Date;
};

export type WorkspaceInvite = {
  id: string;
  workspaceId: string;
  token: string;
  createdBy: string; // userId
  email: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

type WorkspaceDocument = Omit<Workspace, "id">;
type WorkspaceMemberDocument = Omit<WorkspaceMember, "id">;
type WorkspaceInviteDocument = Omit<WorkspaceInvite, "id">;

// ---------------------------------------------------------------------------
// Collection helpers
// ---------------------------------------------------------------------------

async function getWorkspacesCollection(): Promise<Collection<WorkspaceDocument>> {
  const db = await getDb();
  return db.collection<WorkspaceDocument>("workspaces");
}

async function getMembersCollection(): Promise<Collection<WorkspaceMemberDocument>> {
  const db = await getDb();
  return db.collection<WorkspaceMemberDocument>("workspace_members");
}

async function getInvitesCollection(): Promise<Collection<WorkspaceInviteDocument>> {
  const db = await getDb();
  return db.collection<WorkspaceInviteDocument>("workspace_invites");
}

// ---------------------------------------------------------------------------
// Index setup
// ---------------------------------------------------------------------------

let ensureWorkspacesReadyPromise: Promise<void> | undefined;

export async function ensureWorkspacesReady(): Promise<void> {
  if (!ensureWorkspacesReadyPromise) {
    ensureWorkspacesReadyPromise = _ensureWorkspacesReady();
  }
  return ensureWorkspacesReadyPromise;
}

async function _ensureWorkspacesReady(): Promise<void> {
  const [members, invites] = await Promise.all([
    getMembersCollection(),
    getInvitesCollection(),
  ]);

  await Promise.all([
    members.createIndex({ workspaceId: 1, userId: 1 }, { unique: true }),
    members.createIndex({ userId: 1 }),
    invites.createIndex({ token: 1 }, { unique: true }),
    invites.createIndex({ workspaceId: 1 }),
    invites.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function toWorkspace(doc: WithId<WorkspaceDocument>): Workspace {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
  };
}

function toMember(doc: WithId<WorkspaceMemberDocument>): WorkspaceMember {
  return {
    id: doc._id.toHexString(),
    workspaceId: doc.workspaceId,
    userId: doc.userId,
    role: doc.role,
    joinedAt: doc.joinedAt,
  };
}

function toInvite(doc: WithId<WorkspaceInviteDocument>): WorkspaceInvite {
  return {
    id: doc._id.toHexString(),
    workspaceId: doc.workspaceId,
    token: doc.token,
    createdBy: doc.createdBy,
    email: doc.email,
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt,
    usedAt: doc.usedAt,
  };
}

// ---------------------------------------------------------------------------
// Workspace CRUD
// ---------------------------------------------------------------------------

export async function createWorkspace(name: string, createdBy: string): Promise<Workspace> {
  await ensureWorkspacesReady();
  const [workspaces, members] = await Promise.all([
    getWorkspacesCollection(),
    getMembersCollection(),
  ]);

  const now = new Date();
  const doc: WorkspaceDocument = {
    name: name.trim(),
    createdBy,
    createdAt: now,
  };

  const result = await workspaces.insertOne(doc);
  const workspaceId = result.insertedId.toHexString();

  // Creator becomes owner automatically
  const memberDoc: WorkspaceMemberDocument = {
    workspaceId,
    userId: createdBy,
    role: "owner",
    joinedAt: now,
  };
  await members.insertOne(memberDoc);

  return { id: workspaceId, ...doc };
}

export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  await ensureWorkspacesReady();
  const collection = await getWorkspacesCollection();
  const doc = await collection.findOne({ _id: new ObjectId(workspaceId) });
  return doc ? toWorkspace(doc) : null;
}

export async function getWorkspacesByUserId(userId: string): Promise<Workspace[]> {
  await ensureWorkspacesReady();
  const [workspaces, members] = await Promise.all([
    getWorkspacesCollection(),
    getMembersCollection(),
  ]);

  const memberships = await members.find({ userId }).toArray();
  if (memberships.length === 0) return [];

  const workspaceIds = memberships.map((m) => new ObjectId(m.workspaceId));
  const docs = await workspaces.find({ _id: { $in: workspaceIds } }).toArray();
  return docs.map(toWorkspace);
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  await ensureWorkspacesReady();
  const collection = await getMembersCollection();
  const docs = await collection.find({ workspaceId }).toArray();
  return docs.map(toMember);
}

export async function getWorkspaceMembership(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember | null> {
  await ensureWorkspacesReady();
  const collection = await getMembersCollection();
  const doc = await collection.findOne({ workspaceId, userId });
  return doc ? toMember(doc) : null;
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceMemberRole = "member"
): Promise<WorkspaceMember> {
  await ensureWorkspacesReady();
  const collection = await getMembersCollection();

  const existing = await collection.findOne({ workspaceId, userId });
  if (existing) return toMember(existing);

  const doc: WorkspaceMemberDocument = {
    workspaceId,
    userId,
    role,
    joinedAt: new Date(),
  };
  const result = await collection.insertOne(doc);
  return { id: result.insertedId.toHexString(), ...doc };
}

export async function removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  await ensureWorkspacesReady();
  const collection = await getMembersCollection();
  await collection.deleteOne({ workspaceId, userId });
}

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------

const INVITE_EXPIRY_DAYS = 7;

export async function createWorkspaceInvite(
  workspaceId: string,
  createdBy: string,
  email: string
): Promise<WorkspaceInvite> {
  await ensureWorkspacesReady();
  const collection = await getInvitesCollection();

  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const doc: WorkspaceInviteDocument = {
    workspaceId,
    token,
    createdBy,
    email: email.trim().toLowerCase(),
    createdAt: now,
    expiresAt,
    usedAt: null,
  };

  const result = await collection.insertOne(doc);
  return { id: result.insertedId.toHexString(), ...doc };
}

export async function getInviteByToken(token: string): Promise<WorkspaceInvite | null> {
  await ensureWorkspacesReady();
  const collection = await getInvitesCollection();
  const doc = await collection.findOne({ token });
  return doc ? toInvite(doc) : null;
}

export async function markInviteUsed(inviteId: string): Promise<void> {
  await ensureWorkspacesReady();
  const collection = await getInvitesCollection();
  await collection.updateOne(
    { _id: new ObjectId(inviteId) },
    { $set: { usedAt: new Date() } }
  );
}

export async function getActiveInvitesForWorkspace(workspaceId: string): Promise<WorkspaceInvite[]> {
  await ensureWorkspacesReady();
  const collection = await getInvitesCollection();
  const now = new Date();
  const docs = await collection
    .find({ workspaceId, expiresAt: { $gt: now }, usedAt: null })
    .toArray();
  return docs.map(toInvite);
}

export async function deleteWorkspaceInvite(inviteId: string): Promise<void> {
  await ensureWorkspacesReady();
  const collection = await getInvitesCollection();
  await collection.deleteOne({ _id: new ObjectId(inviteId) });
}

export async function renameWorkspace(workspaceId: string, name: string): Promise<void> {
  await ensureWorkspacesReady();
  const collection = await getWorkspacesCollection();
  await collection.updateOne(
    { _id: new ObjectId(workspaceId) },
    { $set: { name: name.trim() } }
  );
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await ensureWorkspacesReady();
  const [workspaces, members, invites] = await Promise.all([
    getWorkspacesCollection(),
    getMembersCollection(),
    getInvitesCollection(),
  ]);
  await Promise.all([
    workspaces.deleteOne({ _id: new ObjectId(workspaceId) }),
    members.deleteMany({ workspaceId }),
    invites.deleteMany({ workspaceId }),
  ]);
}
