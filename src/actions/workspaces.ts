"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import {
  addWorkspaceMember,
  createWorkspace,
  createWorkspaceInvite,
  deleteWorkspace,
  deleteWorkspaceInvite,
  getActiveInvitesForWorkspace,
  getInviteByToken,
  getWorkspaceMembership,
  markInviteUsed,
  removeWorkspaceMember,
  renameWorkspace,
} from "@/lib/workspaces";
import { sendWorkspaceInviteEmail } from "@/lib/email";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/signin");
  }
  return session;
}

function requireUserId(session: Awaited<ReturnType<typeof requireSession>>) {
  const userId = session.user?.id;
  if (!userId) {
    redirect("/signin");
  }
  return userId;
}

// ---------------------------------------------------------------------------
// State types
// ---------------------------------------------------------------------------

export type WorkspaceActionState = {
  ok: boolean;
  message?: string;
  workspaceId?: string;
  inviteToken?: string;
};

// ---------------------------------------------------------------------------
// Create workspace
// ---------------------------------------------------------------------------

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Name too long").transform((s) => s.trim()),
});

export async function createWorkspaceAction(
  _prevState: WorkspaceActionState,
  formData: FormData
): Promise<WorkspaceActionState> {
  const session = await requireSession();
  const userId = requireUserId(session);

  const parsed = createWorkspaceSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  try {
    const workspace = await createWorkspace(parsed.data.name, userId);
    revalidatePath("/workspaces");
    return { ok: true, workspaceId: workspace.id };
  } catch {
    return { ok: false, message: "Could not create workspace." };
  }
}

// ---------------------------------------------------------------------------
// Send email invite
// ---------------------------------------------------------------------------

const emailSchema = z.string().email("Please enter a valid email address.");

export async function sendInviteAction(
  workspaceId: string,
  email: string,
  workspaceName: string,
  baseUrl: string
): Promise<WorkspaceActionState> {
  const session = await requireSession();
  const userId = requireUserId(session);

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return { ok: false, message: parsedEmail.error.issues[0].message };
  }
  const normalizedEmail = parsedEmail.data.trim().toLowerCase();

  const membership = await getWorkspaceMembership(workspaceId, userId);
  if (!membership || membership.role !== "owner") {
    return { ok: false, message: "Only workspace owners can invite users." };
  }

  // Prevent duplicate pending invites to the same email
  const existing = await getActiveInvitesForWorkspace(workspaceId);
  if (existing.some((inv) => inv.email === normalizedEmail)) {
    return { ok: false, message: "An active invite has already been sent to that email." };
  }

  try {
    const invite = await createWorkspaceInvite(workspaceId, userId, normalizedEmail);
    const inviteUrl = `${baseUrl}/join/${invite.token}`;
    await sendWorkspaceInviteEmail(normalizedEmail, workspaceName, inviteUrl);
    revalidatePath(`/workspaces/${workspaceId}`);
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not send invite email." };
  }
}

// ---------------------------------------------------------------------------
// Revoke invite
// ---------------------------------------------------------------------------

export async function revokeInviteAction(
  workspaceId: string,
  inviteId: string
): Promise<WorkspaceActionState> {
  const session = await requireSession();
  const userId = requireUserId(session);

  const membership = await getWorkspaceMembership(workspaceId, userId);
  if (!membership || membership.role !== "owner") {
    return { ok: false, message: "Only workspace owners can revoke invite links." };
  }

  try {
    await deleteWorkspaceInvite(inviteId);
    revalidatePath(`/workspaces/${workspaceId}`);
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not revoke invite." };
  }
}

// ---------------------------------------------------------------------------
// Join workspace via invite token
// ---------------------------------------------------------------------------

export async function joinWorkspaceAction(token: string): Promise<WorkspaceActionState> {
  const session = await requireSession();
  const userId = requireUserId(session);

  const invite = await getInviteByToken(token);

  if (!invite) {
    return { ok: false, message: "Invalid or expired invite link." };
  }

  if (invite.usedAt) {
    // Single-use invites already consumed — still allow joining if not yet a member
  }

  const now = new Date();
  if (invite.expiresAt < now) {
    return { ok: false, message: "This invite link has expired." };
  }

  const existing = await getWorkspaceMembership(invite.workspaceId, userId);
  if (existing) {
    return { ok: true, workspaceId: invite.workspaceId };
  }

  try {
    await addWorkspaceMember(invite.workspaceId, userId);
    await markInviteUsed(invite.id);
    revalidatePath("/workspaces");
    revalidatePath("/");
    return { ok: true, workspaceId: invite.workspaceId };
  } catch {
    return { ok: false, message: "Could not join workspace." };
  }
}

// ---------------------------------------------------------------------------
// Remove member (owner only)
// ---------------------------------------------------------------------------

export async function removeMemberAction(
  workspaceId: string,
  targetUserId: string
): Promise<WorkspaceActionState> {
  const session = await requireSession();
  const userId = requireUserId(session);

  if (userId === targetUserId) {
    return { ok: false, message: "You cannot remove yourself. Use leave workspace instead." };
  }

  const membership = await getWorkspaceMembership(workspaceId, userId);
  if (!membership || membership.role !== "owner") {
    return { ok: false, message: "Only workspace owners can remove members." };
  }

  try {
    await removeWorkspaceMember(workspaceId, targetUserId);
    revalidatePath(`/workspaces/${workspaceId}`);
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not remove member." };
  }
}

// ---------------------------------------------------------------------------
// Leave workspace
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Rename workspace (owner only)
// ---------------------------------------------------------------------------

export async function renameWorkspaceAction(
  workspaceId: string,
  name: string
): Promise<WorkspaceActionState> {
  const session = await requireSession();
  const userId = requireUserId(session);

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) {
    return { ok: false, message: "Name must be between 1 and 80 characters." };
  }

  const membership = await getWorkspaceMembership(workspaceId, userId);
  if (!membership || membership.role !== "owner") {
    return { ok: false, message: "Only workspace owners can rename the workspace." };
  }

  try {
    await renameWorkspace(workspaceId, trimmed);
    revalidatePath(`/workspaces/${workspaceId}`);
    revalidatePath("/workspaces");
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not rename workspace." };
  }
}

// ---------------------------------------------------------------------------
// Delete workspace (owner only)
// ---------------------------------------------------------------------------

export async function deleteWorkspaceAction(
  workspaceId: string
): Promise<WorkspaceActionState> {
  const session = await requireSession();
  const userId = requireUserId(session);

  const membership = await getWorkspaceMembership(workspaceId, userId);
  if (!membership || membership.role !== "owner") {
    return { ok: false, message: "Only workspace owners can delete the workspace." };
  }

  try {
    await deleteWorkspace(workspaceId);
    revalidatePath("/workspaces");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not delete workspace." };
  }
}

// ---------------------------------------------------------------------------
// Leave workspace (member only)
// ---------------------------------------------------------------------------

export async function leaveWorkspaceAction(workspaceId: string): Promise<WorkspaceActionState> {
  const session = await requireSession();
  const userId = requireUserId(session);

  const membership = await getWorkspaceMembership(workspaceId, userId);
  if (!membership) {
    return { ok: false, message: "You are not a member of this workspace." };
  }

  if (membership.role === "owner") {
    return { ok: false, message: "Owners cannot leave. Transfer ownership or delete the workspace first." };
  }

  try {
    await removeWorkspaceMember(workspaceId, userId);
    revalidatePath("/workspaces");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not leave workspace." };
  }
}
