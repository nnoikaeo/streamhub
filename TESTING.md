# Testing Guide - JSON Mock Database Login Flow

## Test Environment Setup

### Prerequisites
1. Feature branch `feat/json-mock-database` 推送已完成
2. Pull Request #9 created
3. Environment variable: `NUXT_PUBLIC_USE_JSON_MOCK=true` (already in .env)

### Start Development Server
```bash
cd /Users/nopphol/Developer/streamhub
npm run dev
# Server starts at http://localhost:3000
```

---

## Test Case 1: Complete Login Flow with Valid User

### Scenario
User with valid credentials logs in successfully

### Test Data
- **Email**: it.streamwash@gmail.com
- **UID**: 61JSdbE674TqRBHHUu9ezdzFul93
- **Role**: admin
- **Company**: STTH

### Steps

1. **Open Login Page**
   ```
   URL: http://localhost:3000/login
   Expected: Login page displays with "Sign in with Google" button
   ```

2. **Click Sign in Button**
   ```
   Action: Click "Sign in with Google" button
   Expected: Google OAuth popup appears (for authentication)
   ```

3. **Complete Google Authentication**
   ```
   Action: Sign in with email: it.streamwash@gmail.com
   Expected: Popup closes, redirects to dashboard
   ```

4. **Verify Backend Calls**
   ```
   Expected API calls (check browser DevTools > Network):

   ✅ GET /api/mock/users/61JSdbE674TqRBHHUu9ezdzFul93
      Response: {
        "success": true,
        "data": {
          "uid": "61JSdbE674TqRBHHUu9ezdzFul93",
          "email": "it.streamwash@gmail.com",
          "name": "IT STTH",
          "role": "admin",
          "company": "STTH",
          "groups": [],
          "isActive": true,
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-02-01T00:00:00.000Z"
        }
      }

   ✅ GET /api/mock/folders?uid=61JSdbE674TqRBHHUu9ezdzFul93&company=STTH
      Response: {
        "success": true,
        "data": [ /* array of 17 folders */ ]
      }

   ✅ GET /api/mock/dashboards?uid=61JSdbE674TqRBHHUu9ezdzFul93&company=STTH
      Response: {
        "success": true,
        "data": [ /* array of accessible dashboards */ ]
      }
   ```

5. **Verify Dashboard Display**
   ```
   Expected:
   - Redirected to /dashboard/discover
   - Sidebar shows folder tree (Sales, Finance, Operations, HR)
   - Main area shows dashboard grid with accessible dashboards
   - User can see 8 dashboards total (or fewer based on permissions)
   ```

6. **Verify Permissions Initialized**
   ```
   Expected in Browser Console:
   ✅ "🔷 [useDashboardService] Using JSON Mock Service"
   ✅ "🔍 [useAuthStore] User authenticated"
   ✅ "✅ Permissions initialized for role: admin"
   ```

### Expected Result ✅
- Login completes successfully
- User redirected to /dashboard/discover
- All API calls return success
- User can see 8 dashboards (admin can see all)
- Permissions set to admin (can create, edit, delete)

---

## Test Case 2: Login with Different User Roles

### Test User 2: Moderator
- **Email**: somchai@streamwash.com
- **UID**: user_somchai_mod
- **Role**: moderator
- **Company**: STTH

### Verify
```
✅ API returns role: "moderator"
✅ Permissions: canCreateFolder=true, canShareDashboard=true, canDeleteDashboard=true
✅ Can see accessible dashboards (some restricted to admin only won't show)
```

### Test User 3: Regular User
- **Email**: teerak@streamwash.com
- **UID**: user_teerak_user
- **Role**: user
- **Company**: STTH
- **Groups**: sales

### Verify
```
✅ API returns role: "user"
✅ Permissions: canCreateFolder=false, canShareDashboard=false, canDeleteDashboard=false
✅ Only sees dashboards accessible to "user" role or "sales" group
✅ Fewer dashboards visible compared to admin
```

---

## Test Case 3: Invalid User (Not in System)

### Scenario
User who logs in with Google but doesn't exist in mock database

### Steps
1. Log out from current user
2. Try to login with a different Google account (not in users.json)

### Expected
```
✅ GET /api/mock/users/:uid returns 404
✅ Error message: "User with UID '...' not found in system"
✅ Redirected back to /login page
✅ Error message displays in red box
```

---

## Test Case 4: API Endpoint Testing (CRUD Operations)

### Test Tool
Use **Postman**, **Thunder Client** (VS Code), or **curl**

### 4.1 Create Dashboard

**Request**
```bash
curl -X POST http://localhost:3000/api/mock/dashboards \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "data": {
      "id": "dash_test_new",
      "name": "Test Dashboard",
      "folderId": "folder_sales",
      "type": "looker",
      "description": "Test dashboard created via API",
      "lookerDashboardId": "test_123",
      "lookerEmbedUrl": "https://example.com/dash",
      "owner": "61JSdbE674TqRBHHUu9ezdzFul93",
      "access": {
        "direct": {
          "users": [],
          "roles": ["user"],
          "groups": []
        },
        "company": {}
      },
      "restrictions": {
        "revoke": [],
        "expiry": {}
      }
    }
  }'
```

**Expected Response**
```json
{
  "success": true,
  "data": {
    "id": "dash_test_new",
    "name": "Test Dashboard",
    "folderId": "folder_sales",
    "owner": "61JSdbE674TqRBHHUu9ezdzFul93",
    "createdAt": "2026-02-16T...",
    "updatedAt": "2026-02-16T..."
  },
  "action": "created"
}
```

**Verify**
```
✅ dashboards.json file updated (check .data/dashboards.json)
✅ New dashboard appears in API GET /api/mock/dashboards
```

### 4.2 Update Dashboard

**Request**
```bash
curl -X POST http://localhost:3000/api/mock/dashboards \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update",
    "data": {
      "id": "dash_test_new",
      "name": "Updated Test Dashboard",
      "description": "Updated via API"
    }
  }'
```

**Expected Response**
```json
{
  "success": true,
  "action": "updated"
}
```

### 4.3 Delete Dashboard

**Request**
```bash
curl -X DELETE http://localhost:3000/api/mock/dashboards/dash_test_new
```

**Expected Response**
```json
{
  "success": true,
  "deleted": true
}
```

### 4.4 Get Dashboards with Filters

**Request - Filter by user and company**
```bash
curl "http://localhost:3000/api/mock/dashboards?uid=61JSdbE674TqRBHHUu9ezdzFul93&company=STTH"
```

**Expected Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "dash_sales_east_performance",
      "name": "Regional East Performance",
      ...
    },
    ...
  ],
  "total": 8
}
```

---

## Test Case 5: User Management API

### 5.1 Get All Users

```bash
curl http://localhost:3000/api/mock/users
```

**Expected**: Array of 6 users

### 5.2 Get Specific User

```bash
curl http://localhost:3000/api/mock/users/user_somchai_mod
```

**Expected**: Single user object

### 5.3 Create User

```bash
curl -X POST http://localhost:3000/api/mock/users \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test_user_new",
    "email": "testuser@example.com",
    "name": "Test User",
    "role": "user",
    "company": "STTH",
    "groups": ["sales"],
    "isActive": true
  }'
```

**Expected**: User created with createdAt and updatedAt timestamps

### 5.4 Delete User

```bash
curl -X DELETE http://localhost:3000/api/mock/users/test_user_new
```

**Expected**: { "success": true, "deleted": true }

---

## Troubleshooting

### Issue: API returns 404
```
❌ Error: "File not found: users.json"
✅ Solution: Check if .data/users.json exists
✅ Run: ls -la .data/
```

### Issue: JSON parse error
```
❌ Error: "Invalid JSON"
✅ Solution: Verify JSON syntax in .data/*.json files
✅ Run: jq . .data/users.json
```

### Issue: Service not using JSON Mock
```
❌ Service still using old MockDashboardService
✅ Solution: Check .env has NUXT_PUBLIC_USE_JSON_MOCK=true
✅ Restart dev server: npm run dev
```

### Issue: Login redirects to /login again
```
❌ User not found error
✅ Solution: Check if user exists in .data/users.json
✅ Check browser console for error message
```

---

## Performance Notes

- All operations are synchronous (file I/O) - fine for testing
- Production would use database (async)
- No pagination implemented yet (all items returned)
- No rate limiting or authentication on /api/mock/* endpoints

---

## Success Criteria ✅

All tests should pass:
- [ ] Test Case 1: Complete login flow successful
- [ ] Test Case 2: Different user roles work correctly
- [ ] Test Case 3: Invalid user handled properly
- [ ] Test Case 4.1: Can create dashboard via API
- [ ] Test Case 4.2: Can update dashboard via API
- [ ] Test Case 4.3: Can delete dashboard via API
- [ ] Test Case 4.4: Filtering returns correct results
- [ ] Test Case 5: User management APIs work

---

## Related Files

- JSON Data: `.data/*.json` (5 files)
- Server Utils: `server/utils/jsonDatabase.ts`
- API Endpoints: `server/api/mock/*` (15 files)
- Service: `app/composables/useJSONMockService.ts`
- Configuration: `app/composables/useDashboardService.ts`, `nuxt.config.ts`, `.env`

---

Last Updated: 2026-02-16
