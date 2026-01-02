# Clerk Test User Setup Guide

## Create Test User in Clerk Dashboard

Your Clerk test app is already configured in `.env.test`. Now you just need to create the test user.

### Steps:

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com

2. **Select your test application**:
   - Should be the one with publishable key: `pk_test_ZGVjZW50LWNhaW1hbi0zOS5jbGVyay5hY2NvdW50cy5kZXYk`

3. **Navigate to Users**:
   - Click "Users" in the left sidebar

4. **Create test user**:
   - Click "Create User" button (top right)
   - **Email address**: `e2e-test@example.com`
   - **Password**: `TestPassword123!`
   - **First name** (optional): `E2E`
   - **Last name** (optional): `Test`
   - Click "Create"

5. **Verify user created**:
   - You should see the user in the users list
   - Email should be verified automatically (dashboard creation)

## Alternative: Use Your Own Test Account

If you prefer, you can use a different test user:

1. Create a user in Clerk with your preferred credentials
2. Update `.env.test` with the new credentials:
   ```bash
   TEST_USER_EMAIL=your-test-email@example.com
   TEST_USER_PASSWORD=YourTestPassword123!
   ```

## Important Notes

- **Do NOT use a real user account** - tests will create/delete projects
- **Email verification**: Dashboard-created users are auto-verified
- **OAuth login**: Tests use email/password, not OAuth (simpler for E2E)
- **Multiple test users**: You can create more later if needed

## Verify Test User Works

After creating the user, you can test login manually:

1. Start dev server: `pnpm --filter web dev`
2. Go to: http://localhost:3001/sign-in
3. Sign in with: `e2e-test@example.com` / `TestPassword123!`
4. You should be redirected to `/dashboard`
5. Sign out before running automated tests

This confirms the test user works before running Playwright tests.
