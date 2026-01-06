import { v } from "convex/values";
import { mutation, query, action, internalMutation, QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// GitHub configuration - stored in Convex environment variables
const GITHUB_REPO_OWNER = "korallis";
const GITHUB_REPO_NAME = "korproxy-support-tickets";

async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

const statusValidator = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("awaiting_reply"),
  v.literal("resolved"),
  v.literal("closed")
);

const priorityValidator = v.union(
  v.literal("low"),
  v.literal("normal"),
  v.literal("high"),
  v.literal("urgent")
);

const logEntryValidator = v.object({
  level: v.string(),
  message: v.string(),
  timestamp: v.number(),
});

const attachmentValidator = v.object({
  fileName: v.string(),
  fileSize: v.number(),
  mimeType: v.string(),
  data: v.string(),
});

const ticketValidator = v.object({
  _id: v.id("supportTickets"),
  _creationTime: v.number(),
  userId: v.id("users"),
  subject: v.string(),
  body: v.string(),
  appVersion: v.string(),
  platform: v.string(),
  os: v.string(),
  logExcerpt: v.optional(v.array(logEntryValidator)),
  attachments: v.optional(v.array(attachmentValidator)),
  githubIssueNumber: v.optional(v.number()),
  githubIssueUrl: v.optional(v.string()),
  status: statusValidator,
  priority: priorityValidator,
  assignedTo: v.optional(v.id("users")),
  lastResponseAt: v.optional(v.number()),
  lastResponseBy: v.optional(v.union(v.literal("user"), v.literal("support"))),
  lastSyncedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

const messageValidator = v.object({
  _id: v.id("supportTicketMessages"),
  _creationTime: v.number(),
  ticketId: v.id("supportTickets"),
  authorId: v.id("users"),
  authorRole: v.union(v.literal("user"), v.literal("support")),
  message: v.string(),
  githubCommentId: v.optional(v.number()),
  githubCommentUrl: v.optional(v.string()),
  createdAt: v.number(),
});

/**
 * Create a new support ticket
 */
export const createTicket = mutation({
  args: {
    token: v.string(),
    subject: v.string(),
    body: v.string(),
    appVersion: v.string(),
    platform: v.string(),
    os: v.string(),
    logExcerpt: v.optional(v.array(logEntryValidator)),
    attachments: v.optional(v.array(attachmentValidator)),
    priority: v.optional(priorityValidator),
  },
  returns: v.object({
    success: v.boolean(),
    ticketId: v.optional(v.id("supportTickets")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { success: false, error: "Invalid or expired session" };
    }

    if (!args.subject.trim()) {
      return { success: false, error: "Subject is required" };
    }

    if (!args.body.trim()) {
      return { success: false, error: "Description is required" };
    }

    const now = Date.now();
    const ticketId = await ctx.db.insert("supportTickets", {
      userId: user._id,
      subject: args.subject.trim(),
      body: args.body.trim(),
      appVersion: args.appVersion,
      platform: args.platform,
      os: args.os,
      logExcerpt: args.logExcerpt,
      attachments: args.attachments,
      status: "open",
      priority: args.priority ?? "normal",
      createdAt: now,
    });

    return { success: true, ticketId };
  },
});

/**
 * List tickets for the current user
 */
export const listMyTickets = query({
  args: {
    token: v.string(),
    status: v.optional(statusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    tickets: v.array(ticketValidator),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { tickets: [] };
    }

    const limit = args.limit ?? 50;

    let ticketsQuery = ctx.db
      .query("supportTickets")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    const allTickets = await ticketsQuery.order("desc").take(limit);

    // Filter by status if specified
    const tickets = args.status
      ? allTickets.filter((t) => t.status === args.status)
      : allTickets;

    return { tickets };
  },
});

/**
 * Get a single ticket by ID (user can only see their own)
 */
export const getTicket = query({
  args: {
    token: v.string(),
    ticketId: v.id("supportTickets"),
  },
  returns: v.union(ticketValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return null;
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      return null;
    }

    // Users can only see their own tickets, admins can see all
    if (ticket.userId !== user._id && user.role !== "admin") {
      return null;
    }

    return ticket;
  },
});

/**
 * Get messages for a ticket
 */
export const getTicketMessages = query({
  args: {
    token: v.string(),
    ticketId: v.id("supportTickets"),
  },
  returns: v.object({
    messages: v.array(messageValidator),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { messages: [] };
    }

    // Check ticket access
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      return { messages: [] };
    }

    if (ticket.userId !== user._id && user.role !== "admin") {
      return { messages: [] };
    }

    const messages = await ctx.db
      .query("supportTicketMessages")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .collect();

    return { messages };
  },
});

/**
 * Add a message to a ticket (reply)
 */
export const addMessage = mutation({
  args: {
    token: v.string(),
    ticketId: v.id("supportTickets"),
    message: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    messageId: v.optional(v.id("supportTicketMessages")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { success: false, error: "Invalid or expired session" };
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    // Users can only reply to their own tickets, admins can reply to any
    if (ticket.userId !== user._id && user.role !== "admin") {
      return { success: false, error: "Not authorized" };
    }

    if (!args.message.trim()) {
      return { success: false, error: "Message is required" };
    }

    const now = Date.now();
    // Critical: ticket owners should always be "user" even if they are an admin.
    // Admins replying to someone else's ticket are "support".
    const isOwner = ticket.userId === user._id;
    const authorRole = isOwner ? "user" : "support";

    const messageId = await ctx.db.insert("supportTicketMessages", {
      ticketId: args.ticketId,
      authorId: user._id,
      authorRole,
      message: args.message.trim(),
      createdAt: now,
    });

    // Update ticket with last response info
    const newStatus = authorRole === "support" ? "awaiting_reply" : "open";
    await ctx.db.patch(args.ticketId, {
      lastResponseAt: now,
      lastResponseBy: authorRole,
      status: ticket.status === "closed" ? ticket.status : newStatus,
      updatedAt: now,
    });

    return { success: true, messageId };
  },
});

/**
 * Internal mutation to update a message with GitHub comment info.
 */
export const updateMessageWithGitHub = internalMutation({
  args: {
    messageId: v.id("supportTicketMessages"),
    githubCommentId: v.number(),
    githubCommentUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      githubCommentId: args.githubCommentId,
      githubCommentUrl: args.githubCommentUrl,
    });
  },
});

function withKorProxyAuthorMarker(authorRole: "user" | "support", body: string): string {
  // Invisible marker in GitHub markdown; used to correctly infer author on sync.
  return `<!-- korproxy:author=${authorRole} -->\n${body}`;
}

function inferAuthorRoleFromBody(body: string): "user" | "support" {
  if (body.includes("<!-- korproxy:author=user -->")) return "user";
  if (body.includes("<!-- korproxy:author=support -->")) return "support";
  return "support";
}

/**
 * Add a reply and immediately post it to GitHub (if linked).
 */
export const addMessageWithGitHub = action({
  args: {
    token: v.string(),
    ticketId: v.id("supportTickets"),
    message: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    messageId: v.optional(v.id("supportTicketMessages")),
    githubCommentUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    messageId?: Id<"supportTicketMessages">;
    githubCommentUrl?: string;
    error?: string;
  }> => {
    // First write to Convex
    const addResult = await ctx.runMutation(api.supportTickets.addMessage, {
      token: args.token,
      ticketId: args.ticketId,
      message: args.message,
    });

    if (!addResult.success || !addResult.messageId) {
      return { success: false, error: addResult.error ?? "Failed to add message" };
    }

    // If ticket isn't linked to GitHub, we're done.
    const ticket = await ctx.runQuery(api.supportTickets.getTicket, {
      token: args.token,
      ticketId: args.ticketId,
    });
    if (!ticket || !ticket.githubIssueNumber) {
      return { success: true, messageId: addResult.messageId };
    }

    const GITHUB_PAT = process.env.GITHUB_PAT;
    if (!GITHUB_PAT) {
      // Still return success; message exists in Convex.
      return { success: true, messageId: addResult.messageId };
    }

    // Determine authorRole for marker based on the stored message we just created.
    const messages = await ctx.runQuery(api.supportTickets.getTicketMessages, {
      token: args.token,
      ticketId: args.ticketId,
    });
    const created = messages.messages.find((m) => m._id === addResult.messageId);
    const authorRole = created?.authorRole === "user" ? "user" : "support";

    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/${ticket.githubIssueNumber}/comments`,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${GITHUB_PAT}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: withKorProxyAuthorMarker(authorRole, args.message.trim()),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GitHub API error:", response.status, errorText);
        return { success: true, messageId: addResult.messageId };
      }

      const comment = (await response.json()) as GitHubComment;

      await ctx.runMutation(internal.supportTickets.updateMessageWithGitHub, {
        messageId: addResult.messageId,
        githubCommentId: comment.id,
        githubCommentUrl: comment.html_url,
      });

      return { success: true, messageId: addResult.messageId, githubCommentUrl: comment.html_url };
    } catch (error) {
      console.error("Failed to create GitHub comment:", error);
      return { success: true, messageId: addResult.messageId };
    }
  },
});

/**
 * Update ticket status (admin only, or user can close their own)
 */
export const updateTicketStatus = mutation({
  args: {
    token: v.string(),
    ticketId: v.id("supportTickets"),
    status: statusValidator,
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { success: false, error: "Invalid or expired session" };
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    // Users can only close their own tickets
    const isOwner = ticket.userId === user._id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Not authorized" };
    }

    // Users can only close (not reopen or change other statuses)
    if (isOwner && !isAdmin && args.status !== "closed") {
      return { success: false, error: "Users can only close tickets" };
    }

    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * List all tickets (admin only)
 */
export const listAllTickets = query({
  args: {
    token: v.string(),
    status: v.optional(statusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    tickets: v.array(ticketValidator),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user || user.role !== "admin") {
      return { tickets: [] };
    }

    const limit = args.limit ?? 100;

    let ticketsQuery;
    if (args.status) {
      ticketsQuery = ctx.db
        .query("supportTickets")
        .withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      ticketsQuery = ctx.db.query("supportTickets").withIndex("by_date");
    }

    const tickets = await ticketsQuery.order("desc").take(limit);

    return { tickets };
  },
});

/**
 * Assign ticket to admin (admin only)
 */
export const assignTicket = mutation({
  args: {
    token: v.string(),
    ticketId: v.id("supportTickets"),
    assigneeId: v.optional(v.id("users")),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user || user.role !== "admin") {
      return { success: false, error: "Not authorized" };
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    await ctx.db.patch(args.ticketId, {
      assignedTo: args.assigneeId,
      status: args.assigneeId ? "in_progress" : ticket.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════
// GITHUB INTEGRATION
// ═══════════════════════════════════════════════════════════════

interface GitHubIssue {
  number: number;
  html_url: string;
  state: string;
  title: string;
  body: string;
}

interface GitHubComment {
  id: number;
  html_url: string;
  body: string;
  created_at: string;
  user: {
    login: string;
  };
}

/**
 * Internal mutation to update ticket with GitHub issue info
 */
export const updateTicketWithGitHub = internalMutation({
  args: {
    ticketId: v.id("supportTickets"),
    githubIssueNumber: v.number(),
    githubIssueUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      githubIssueNumber: args.githubIssueNumber,
      githubIssueUrl: args.githubIssueUrl,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Internal mutation to add a synced message from GitHub
 */
export const addSyncedMessage = internalMutation({
  args: {
    ticketId: v.id("supportTickets"),
    authorId: v.id("users"),
    authorRole: v.union(v.literal("user"), v.literal("support")),
    message: v.string(),
    githubCommentId: v.number(),
    githubCommentUrl: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if this comment already exists
    const existing = await ctx.db
      .query("supportTicketMessages")
      .withIndex("by_github_comment", (q) => q.eq("githubCommentId", args.githubCommentId))
      .first();

    if (existing) {
      return existing._id;
    }

    const messageId = await ctx.db.insert("supportTicketMessages", {
      ticketId: args.ticketId,
      authorId: args.authorId,
      authorRole: args.authorRole,
      message: args.message,
      githubCommentId: args.githubCommentId,
      githubCommentUrl: args.githubCommentUrl,
      createdAt: args.createdAt,
    });

    // Update ticket with last response info
    await ctx.db.patch(args.ticketId, {
      lastResponseAt: args.createdAt,
      lastResponseBy: args.authorRole,
      lastSyncedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Internal mutation to update ticket sync timestamp
 */
export const updateTicketSyncTime = internalMutation({
  args: {
    ticketId: v.id("supportTickets"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      lastSyncedAt: Date.now(),
    });
  },
});

/**
 * Create a GitHub issue for a support ticket
 */
export const createGitHubIssue = action({
  args: {
    token: v.string(),
    ticketId: v.id("supportTickets"),
  },
  returns: v.object({
    success: v.boolean(),
    issueNumber: v.optional(v.number()),
    issueUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    issueNumber?: number;
    issueUrl?: string;
    error?: string;
  }> => {
    const GITHUB_PAT = process.env.GITHUB_PAT;
    if (!GITHUB_PAT) {
      return { success: false, error: "GitHub integration not configured" };
    }

    // Get the ticket
    const ticket = await ctx.runQuery(api.supportTickets.getTicket, {
      token: args.token,
      ticketId: args.ticketId,
    });

    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    // Don't create duplicate issues
    if (ticket.githubIssueNumber) {
      return {
        success: true,
        issueNumber: ticket.githubIssueNumber,
        issueUrl: ticket.githubIssueUrl ?? undefined,
      };
    }

    // Build issue body with diagnostics
    let issueBody = `**User ID:** \`${ticket.userId}\`\n`;
    issueBody += `**App Version:** ${ticket.appVersion}\n`;
    issueBody += `**Platform:** ${ticket.platform}\n`;
    issueBody += `**OS:** ${ticket.os}\n`;
    issueBody += `**Priority:** ${ticket.priority}\n`;
    issueBody += `**Created:** ${new Date(ticket.createdAt).toISOString()}\n\n`;
    issueBody += `---\n\n`;
    issueBody += ticket.body;

    // Add log excerpt if available
    if (ticket.logExcerpt && ticket.logExcerpt.length > 0) {
      issueBody += `\n\n---\n\n**Recent Logs:**\n\`\`\`\n`;
      for (const log of ticket.logExcerpt.slice(0, 10)) {
        issueBody += `[${log.level}] ${log.message}\n`;
      }
      issueBody += `\`\`\``;
    }

    // Determine labels based on priority
    const labels = [`priority:${ticket.priority}`, `user:${ticket.userId}`];

    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${GITHUB_PAT}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: ticket.subject,
            body: issueBody,
            labels,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GitHub API error:", response.status, errorText);
        return { success: false, error: `GitHub API error: ${response.status}` };
      }

      const issue = (await response.json()) as GitHubIssue;

      // Update ticket with GitHub info
      await ctx.runMutation(internal.supportTickets.updateTicketWithGitHub, {
        ticketId: args.ticketId,
        githubIssueNumber: issue.number,
        githubIssueUrl: issue.html_url,
      });

      // Upload attachments as comments if any
      if (ticket.attachments && ticket.attachments.length > 0) {
        for (const attachment of ticket.attachments) {
          // Create a comment with attachment info (base64 data truncated for readability)
          const attachmentComment = `**Attachment:** ${attachment.fileName}\n**Size:** ${attachment.fileSize} bytes\n**Type:** ${attachment.mimeType}\n\n<details>\n<summary>Base64 Data (click to expand)</summary>\n\n\`\`\`\n${attachment.data.substring(0, 1000)}${attachment.data.length > 1000 ? "..." : ""}\n\`\`\`\n</details>`;

          await fetch(
            `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/${issue.number}/comments`,
            {
              method: "POST",
              headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${GITHUB_PAT}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                body: attachmentComment,
              }),
            }
          );
        }
      }

      return {
        success: true,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
      };
    } catch (error) {
      console.error("Failed to create GitHub issue:", error);
      return { success: false, error: "Failed to create GitHub issue" };
    }
  },
});

/**
 * Sync comments from GitHub for a specific ticket
 */
export const syncTicketComments = action({
  args: {
    token: v.string(),
    ticketId: v.id("supportTickets"),
  },
  returns: v.object({
    success: v.boolean(),
    newCommentsCount: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    newCommentsCount: number;
    error?: string;
  }> => {
    const GITHUB_PAT = process.env.GITHUB_PAT;
    if (!GITHUB_PAT) {
      return { success: false, newCommentsCount: 0, error: "GitHub integration not configured" };
    }

    // Get the ticket
    const ticket = await ctx.runQuery(api.supportTickets.getTicket, {
      token: args.token,
      ticketId: args.ticketId,
    });

    if (!ticket) {
      return { success: false, newCommentsCount: 0, error: "Ticket not found" };
    }

    if (!ticket.githubIssueNumber) {
      return { success: false, newCommentsCount: 0, error: "Ticket has no linked GitHub issue" };
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/${ticket.githubIssueNumber}/comments`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${GITHUB_PAT}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (!response.ok) {
        return { success: false, newCommentsCount: 0, error: `GitHub API error: ${response.status}` };
      }

      const comments = (await response.json()) as GitHubComment[];
      let newCommentsCount = 0;

      // Get existing messages to find which GitHub comments we already have
      const existingMessages = await ctx.runQuery(api.supportTickets.getTicketMessages, {
        token: args.token,
        ticketId: args.ticketId,
      });

      const existingGithubCommentIds = new Set(
        existingMessages.messages
          .filter((m) => m.githubCommentId)
          .map((m) => m.githubCommentId)
      );

      for (const comment of comments) {
        // Skip if we already have this comment
        if (existingGithubCommentIds.has(comment.id)) {
          continue;
        }

        // Skip attachment comments (our own uploads)
        if (comment.body.startsWith("**Attachment:**")) {
          continue;
        }

        const authorRole = inferAuthorRoleFromBody(comment.body);
        const isSupport = authorRole === "support";

        await ctx.runMutation(internal.supportTickets.addSyncedMessage, {
          ticketId: args.ticketId,
          authorId: ticket.userId, // We use the ticket owner as authorId for support messages too
          authorRole: isSupport ? "support" : "user",
          message: comment.body,
          githubCommentId: comment.id,
          githubCommentUrl: comment.html_url,
          createdAt: new Date(comment.created_at).getTime(),
        });

        newCommentsCount++;
      }

      // Update sync timestamp
      await ctx.runMutation(internal.supportTickets.updateTicketSyncTime, {
        ticketId: args.ticketId,
      });

      return { success: true, newCommentsCount };
    } catch (error) {
      console.error("Failed to sync GitHub comments:", error);
      return { success: false, newCommentsCount: 0, error: "Failed to sync comments" };
    }
  },
});

/**
 * Sync all tickets for a user
 */
export const syncAllUserTickets = action({
  args: {
    token: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    syncedTickets: v.number(),
    newComments: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    syncedTickets: number;
    newComments: number;
    error?: string;
  }> => {
    const GITHUB_PAT = process.env.GITHUB_PAT;
    if (!GITHUB_PAT) {
      return { success: false, syncedTickets: 0, newComments: 0, error: "GitHub integration not configured" };
    }

    // Get all user tickets
    const result = await ctx.runQuery(api.supportTickets.listMyTickets, {
      token: args.token,
    });

    if (!result.tickets || result.tickets.length === 0) {
      return { success: true, syncedTickets: 0, newComments: 0 };
    }

    let syncedTickets = 0;
    let totalNewComments = 0;

    for (const ticket of result.tickets) {
      // Only sync tickets that have GitHub issues and are not closed
      if (!ticket.githubIssueNumber || ticket.status === "closed") {
        continue;
      }

      const syncResult = await ctx.runAction(api.supportTickets.syncTicketComments, {
        token: args.token,
        ticketId: ticket._id,
      });

      if (syncResult.success) {
        syncedTickets++;
        totalNewComments += syncResult.newCommentsCount;
      }
    }

    return {
      success: true,
      syncedTickets,
      newComments: totalNewComments,
    };
  },
});

/**
 * Create ticket and GitHub issue together
 */
export const createTicketWithGitHub = action({
  args: {
    token: v.string(),
    subject: v.string(),
    body: v.string(),
    appVersion: v.string(),
    platform: v.string(),
    os: v.string(),
    logExcerpt: v.optional(v.array(logEntryValidator)),
    attachments: v.optional(v.array(attachmentValidator)),
    priority: v.optional(priorityValidator),
  },
  returns: v.object({
    success: v.boolean(),
    ticketId: v.optional(v.id("supportTickets")),
    githubIssueUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    ticketId?: Id<"supportTickets">;
    githubIssueUrl?: string;
    error?: string;
  }> => {
    // First create the ticket in Convex
    const createResult = await ctx.runMutation(api.supportTickets.createTicket, {
      token: args.token,
      subject: args.subject,
      body: args.body,
      appVersion: args.appVersion,
      platform: args.platform,
      os: args.os,
      logExcerpt: args.logExcerpt,
      attachments: args.attachments,
      priority: args.priority,
    });

    if (!createResult.success || !createResult.ticketId) {
      return {
        success: false,
        error: createResult.error ?? "Failed to create ticket",
      };
    }

    // Then create the GitHub issue
    const githubResult = await ctx.runAction(api.supportTickets.createGitHubIssue, {
      token: args.token,
      ticketId: createResult.ticketId,
    });

    // Return success even if GitHub creation fails (ticket is still created)
    return {
      success: true,
      ticketId: createResult.ticketId,
      githubIssueUrl: githubResult.issueUrl,
    };
  },
});
