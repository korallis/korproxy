# Convex LLM Reference

This document is a condensed reference for AI agents working with Convex in the KorProxy project.
**Always consult this when creating or modifying Convex code.**

For full documentation: https://docs.convex.dev/llms.txt

## Key Concepts

### Schema Definition (convex/schema.ts)
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),
});
```

### Queries (read-only, cached, reactive)
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { email: v.string() },
  returns: v.union(v.object({ ... }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});
```

### Mutations (read/write, transactional)
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: { email: v.string() },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      email: args.email,
      createdAt: Date.now(),
    });
  },
});
```

### Actions (external APIs, non-transactional)
```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";

export const callExternalAPI = action({
  args: { data: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const response = await fetch("https://api.example.com", {
      method: "POST",
      body: JSON.stringify({ data: args.data }),
    });
    return await response.text();
  },
});
```

### HTTP Actions (webhooks, REST endpoints)
```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    // Process webhook...
    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

## Validators (v.*)
- `v.string()`, `v.number()`, `v.boolean()`, `v.null()`
- `v.id("tableName")` - Document ID reference
- `v.array(v.string())` - Arrays
- `v.object({ field: v.string() })` - Objects
- `v.optional(v.string())` - Optional fields
- `v.union(v.literal("a"), v.literal("b"))` - Union types
- `v.literal("value")` - Exact value

## Database Operations
```typescript
// Insert
const id = await ctx.db.insert("table", { ...doc });

// Get by ID
const doc = await ctx.db.get(id);

// Update (patch)
await ctx.db.patch(id, { field: "newValue" });

// Replace entire document
await ctx.db.replace(id, { ...newDoc });

// Delete
await ctx.db.delete(id);

// Query with index
const results = await ctx.db
  .query("table")
  .withIndex("by_field", (q) => q.eq("field", value))
  .collect();

// Query ordering
const results = await ctx.db.query("table").order("desc").take(10);
```

## Internal Functions
```typescript
import { internalMutation, internalQuery, internalAction } from "./_generated/server";

// Can only be called from other Convex functions
export const internalFunc = internalMutation({
  args: { ... },
  handler: async (ctx, args) => { ... },
});

// Call internal function from action
await ctx.runMutation(internal.module.internalFunc, { ... });
```

## Environment Variables
```bash
npx convex env set VARIABLE_NAME value
```
Access in functions:
```typescript
const value = process.env.VARIABLE_NAME;
```

## Best Practices
1. Always validate args with `v.*` validators
2. Use indexes for queries filtering on specific fields
3. Keep mutations small and fast (< 1 second)
4. Use actions for external API calls, then call mutations to save results
5. Use `internalMutation`/`internalQuery` for functions only called server-side
6. Return explicit types with `returns:` validator
7. Handle errors with try/catch and return error objects instead of throwing

## KorProxy Convex Structure
- `convex/schema.ts` - Database schema
- `convex/auth.ts` - Authentication mutations (register, login, logout)
- `convex/subscriptions.ts` - Subscription status queries
- `convex/admin.ts` - Admin dashboard queries
- `convex/stripe.ts` - Stripe webhook handlers (to be created)
- `convex/http.ts` - HTTP routes for webhooks (to be created)
