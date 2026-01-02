# Test Database Setup Guide

## Option 1: Create Test Database in Neon Dashboard (Recommended)

1. **Go to Neon Dashboard**: https://console.neon.tech
2. **Select your project**: `ep-blue-shadow-af9gdki7`
3. **Create new database**:
   - Click "Databases" in sidebar
   - Click "Create Database"
   - Name: `neondb_test`
   - Owner: `neondb_owner` (same as dev)
   - Click "Create"

4. **Verify connection string**:
   - The DATABASE_URL_TEST in .env.test should work automatically
   - It uses the same credentials and endpoint as your dev database
   - Only the database name is different: `/neondb_test` instead of `/neondb`

## Option 2: Create via SQL (Alternative)

If you prefer SQL, connect to your Neon instance and run:

```sql
CREATE DATABASE neondb_test OWNER neondb_owner;
```

## Next Steps After Database Creation

Once the database exists, run migrations:

```bash
# From the project root
cd apps/web

# Run Prisma migrations on test database
DATABASE_URL="postgresql://neondb_owner:npg_PUi3E7hHycWx@ep-blue-shadow-af9gdki7-pooler.c-2.us-west-2.aws.neon.tech/neondb_test?sslmode=require&channel_binding=require" pnpm prisma migrate deploy

# Or use the env file
source .env.test && DATABASE_URL=$DATABASE_URL_TEST pnpm prisma migrate deploy
```

## Verify Database Setup

```bash
# Check if database exists and has correct schema
DATABASE_URL=$DATABASE_URL_TEST pnpm prisma studio
```

This should open Prisma Studio connected to your test database. You should see all tables but no data (empty database).
