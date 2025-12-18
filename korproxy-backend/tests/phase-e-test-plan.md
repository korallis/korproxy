# Phase E Test Plan

This document outlines the test cases for Phase E Convex backend functions. Convex functions require specific testing approaches - either using Convex's testing framework or manual testing through the dashboard.

## Feedback Functions

### feedback.submit
- [ ] Creates entry with valid data (category, message)
- [ ] Sets status to 'new' by default
- [ ] Handles anonymous submission (userId = null)
- [ ] Stores log excerpt when provided
- [ ] Validates category enum ('bug', 'feature', 'question', 'other')
- [ ] Stores contactEmail when provided
- [ ] Records submittedAt timestamp
- [ ] Associates with authenticated user when logged in

### feedback.list
- [ ] Returns paginated results (default page size)
- [ ] Filters by status correctly ('new', 'in-progress', 'resolved', 'closed')
- [ ] Sorts by date descending (newest first)
- [ ] Respects limit parameter
- [ ] Returns empty array when no feedback exists
- [ ] Admin-only access (returns error for non-admin)

### feedback.updateStatus
- [ ] Changes status correctly from 'new' to 'in-progress'
- [ ] Changes status correctly from 'in-progress' to 'resolved'
- [ ] Changes status correctly to 'closed'
- [ ] Admin-only check works (rejects non-admin users)
- [ ] Records statusUpdatedAt timestamp
- [ ] Validates status enum values

### feedback.get
- [ ] Returns feedback by ID
- [ ] Includes all fields (category, message, status, logs, etc.)
- [ ] Returns null for non-existent ID

---

## Users Functions

### users.setAcquisitionSource
- [ ] Sets source field correctly ('organic', 'referral', 'campaign', etc.)
- [ ] Sets UTM fields (utm_source, utm_medium, utm_campaign)
- [ ] Sets acquisitionDate timestamp
- [ ] Only sets once (doesn't overwrite existing)
- [ ] Works for authenticated users only

### users.getProfile
- [ ] Returns user profile data
- [ ] Includes acquisition source if set
- [ ] Returns null for unauthenticated users

### users.updateProfile
- [ ] Updates allowed profile fields
- [ ] Rejects invalid field updates
- [ ] Validates email format when updating

---

## Manual Testing Procedures

### Testing feedback.submit via Convex Dashboard

1. Navigate to Convex Dashboard > Functions
2. Select `feedback:submit`
3. Test with valid payload:
```json
{
  "category": "bug",
  "message": "Test feedback message",
  "contactEmail": "test@example.com",
  "includeDiagnostics": true
}
```
4. Verify entry created in Data > feedback table
5. Verify status is 'new'

### Testing feedback.list

1. Create multiple feedback entries
2. Call `feedback:list` with different filters:
   - No filter (should return all)
   - `status: "new"` (should return only new)
   - `limit: 5` (should return max 5)
3. Verify sort order is newest first

### Testing users.setAcquisitionSource

1. Navigate to Functions > `users:setAcquisitionSource`
2. Test with valid payload:
```json
{
  "source": "campaign",
  "utm_source": "twitter",
  "utm_medium": "social",
  "utm_campaign": "launch2024"
}
```
3. Verify user record updated in Data > users table
4. Call again - verify it doesn't overwrite

---

## Integration Test Scenarios

### Scenario 1: Anonymous Feedback Flow
1. User not logged in
2. Submits feedback via app
3. Feedback stored with userId = null
4. Admin can view and update status

### Scenario 2: Authenticated Feedback Flow
1. User logs in
2. Submits feedback with diagnostics
3. Feedback associated with userId
4. Logs attached and redacted properly

### Scenario 3: Attribution Flow
1. User visits site with UTM params
2. User registers/logs in
3. Attribution captured and stored
4. Shows in admin analytics

---

## Test Data Requirements

### Feedback Categories
- `bug` - Bug reports
- `feature` - Feature requests
- `question` - Support questions
- `other` - General feedback

### Feedback Statuses
- `new` - Just submitted
- `in-progress` - Being reviewed
- `resolved` - Fixed/answered
- `closed` - No action needed

### Acquisition Sources
- `organic` - Direct visit
- `referral` - From another user
- `campaign` - Marketing campaign
- `search` - From search engine
- `social` - From social media

---

## Future Convex Testing Setup

When Convex testing becomes available or when setting up proper E2E tests:

1. Use `convex test` command (if available)
2. Set up test database isolation
3. Create test fixtures for:
   - Test users (admin and regular)
   - Sample feedback entries
   - Attribution records

### Example Test Structure (Future)
```typescript
// convex/tests/feedback.test.ts
import { convexTest } from "convex-test";
import { expect, describe, it } from "vitest";
import { api } from "./_generated/api";

describe("feedback", () => {
  it("creates feedback with correct defaults", async () => {
    const t = convexTest();
    const feedbackId = await t.mutation(api.feedback.submit, {
      category: "bug",
      message: "Test bug report",
    });
    const feedback = await t.query(api.feedback.get, { id: feedbackId });
    expect(feedback.status).toBe("new");
  });
});
```

---

## Notes

- Convex functions should be tested primarily through the Convex Dashboard during development
- Production tests should use staging environment
- Never run destructive tests on production data
- Use Convex's built-in validation for schema enforcement
