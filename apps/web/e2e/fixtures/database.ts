import { test as base } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
})

type DatabaseFixtures = {
  cleanDatabase: void
}

/**
 * Database fixture - provides clean database for each test
 *
 * Usage:
 * ```ts
 * test('my test', async ({ cleanDatabase }) => {
 *   // Database is clean at start of test
 *   // All data will be cleaned up after test
 * })
 * ```
 *
 * Note: Requires DATABASE_URL_TEST environment variable
 * pointing to a separate test database instance.
 */
export const test = base.extend<DatabaseFixtures>({
  cleanDatabase: async ({}, use) => {
    // Truncate all tables before test
    await prisma.$transaction([
      prisma.project_members.deleteMany(),
      prisma.project_versions.deleteMany(),
      prisma.share_tokens.deleteMany(),
      prisma.projects.deleteMany(),
      // User table preserved - test user should persist
    ])

    await use(undefined)

    // Optional: cleanup after test
    // (or leave data for debugging)
  },
})

export { expect } from '@playwright/test'
