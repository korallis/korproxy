import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";

async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

const deviceInfoValidator = v.object({
  deviceId: v.string(),
  deviceName: v.string(),
  deviceType: v.union(v.literal("desktop"), v.literal("laptop"), v.literal("other")),
  platform: v.union(v.literal("darwin"), v.literal("win32"), v.literal("linux")),
  appVersion: v.string(),
});

const deviceValidator = v.object({
  _id: v.id("devices"),
  _creationTime: v.number(),
  userId: v.id("users"),
  deviceId: v.string(),
  deviceName: v.string(),
  deviceType: v.union(v.literal("desktop"), v.literal("laptop"), v.literal("other")),
  platform: v.union(v.literal("darwin"), v.literal("win32"), v.literal("linux")),
  appVersion: v.string(),
  lastSeenAt: v.number(),
  createdAt: v.number(),
});

export const register = mutation({
  args: {
    token: v.string(),
    deviceInfo: deviceInfoValidator,
  },
  returns: v.object({
    success: v.boolean(),
    deviceId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { success: false, error: "Invalid or expired session" };
    }

    const existingDevice = await ctx.db
      .query("devices")
      .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceInfo.deviceId))
      .first();

    const now = Date.now();

    if (existingDevice) {
      if (existingDevice.userId !== user._id) {
        return { success: false, error: "Device registered to another user" };
      }

      await ctx.db.patch(existingDevice._id, {
        deviceName: args.deviceInfo.deviceName,
        deviceType: args.deviceInfo.deviceType,
        platform: args.deviceInfo.platform,
        appVersion: args.deviceInfo.appVersion,
        lastSeenAt: now,
      });

      return { success: true, deviceId: args.deviceInfo.deviceId };
    }

    await ctx.db.insert("devices", {
      userId: user._id,
      deviceId: args.deviceInfo.deviceId,
      deviceName: args.deviceInfo.deviceName,
      deviceType: args.deviceInfo.deviceType,
      platform: args.deviceInfo.platform,
      appVersion: args.deviceInfo.appVersion,
      lastSeenAt: now,
      createdAt: now,
    });

    return { success: true, deviceId: args.deviceInfo.deviceId };
  },
});

export const listForUser = query({
  args: {
    token: v.string(),
  },
  returns: v.union(v.array(deviceValidator), v.null()),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return devices;
  },
});

export const remove = mutation({
  args: {
    token: v.string(),
    deviceId: v.string(),
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

    const device = await ctx.db
      .query("devices")
      .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
      .first();

    if (!device) {
      return { success: false, error: "Device not found" };
    }

    if (device.userId !== user._id) {
      return { success: false, error: "Not authorized to remove this device" };
    }

    await ctx.db.delete(device._id);
    return { success: true };
  },
});

export const updateLastSeen = mutation({
  args: {
    token: v.string(),
    deviceId: v.string(),
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

    const device = await ctx.db
      .query("devices")
      .withIndex("by_device_id", (q) => q.eq("deviceId", args.deviceId))
      .first();

    if (!device) {
      return { success: false, error: "Device not found" };
    }

    if (device.userId !== user._id) {
      return { success: false, error: "Not authorized to update this device" };
    }

    await ctx.db.patch(device._id, {
      lastSeenAt: Date.now(),
    });

    return { success: true };
  },
});
