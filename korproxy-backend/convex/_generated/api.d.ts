/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as devices from "../devices.js";
import type * as entitlements from "../entitlements.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_rbac from "../lib/rbac.js";
import type * as members from "../members.js";
import type * as stripe from "../stripe.js";
import type * as subscriptions from "../subscriptions.js";
import type * as supportTickets from "../supportTickets.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  devices: typeof devices;
  entitlements: typeof entitlements;
  feedback: typeof feedback;
  http: typeof http;
  invites: typeof invites;
  "lib/password": typeof lib_password;
  "lib/rbac": typeof lib_rbac;
  members: typeof members;
  stripe: typeof stripe;
  subscriptions: typeof subscriptions;
  supportTickets: typeof supportTickets;
  teams: typeof teams;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
