#!/usr/bin/env node

/**
 * Verification script for Clerk authentication setup
 * Run with: node scripts/check-auth-setup.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

console.log('🔍 Checking Clerk authentication setup...\n')

const checks = []
let hasErrors = false

// Check 1: .env.local exists
const envLocalPath = join(rootDir, '.env.local')
if (existsSync(envLocalPath)) {
  checks.push({ status: '✅', message: '.env.local file exists' })

  // Check environment variables
  const envContent = readFileSync(envLocalPath, 'utf-8')

  const requiredVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ]

  const optionalVars = [
    'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
    'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
    'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
    'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
  ]

  requiredVars.forEach((varName) => {
    const regex = new RegExp(`^${varName}=.+`, 'm')
    if (regex.test(envContent)) {
      const value = envContent.match(regex)[0].split('=')[1]
      if (value.includes('pk_test_') || value.includes('sk_test_')) {
        checks.push({ status: '✅', message: `${varName} is set` })
      } else if (value === '...' || value === '') {
        checks.push({
          status: '⚠️',
          message: `${varName} is set but appears to be placeholder`,
        })
        hasErrors = true
      } else {
        checks.push({ status: '✅', message: `${varName} is set` })
      }
    } else {
      checks.push({ status: '❌', message: `${varName} is missing` })
      hasErrors = true
    }
  })

  optionalVars.forEach((varName) => {
    const regex = new RegExp(`^${varName}=.+`, 'm')
    if (regex.test(envContent)) {
      checks.push({ status: '✅', message: `${varName} is set (optional)` })
    } else {
      checks.push({
        status: 'ℹ️',
        message: `${varName} not set (will use default)`,
      })
    }
  })
} else {
  checks.push({ status: '❌', message: '.env.local file missing' })
  checks.push({
    status: 'ℹ️',
    message: 'Run: cp .env.example .env.local',
  })
  hasErrors = true
}

// Check 2: Key files exist
const requiredFiles = [
  'src/middleware.ts',
  'src/lib/auth.ts',
  'src/app/layout.tsx',
  'src/app/sign-in/[[...sign-in]]/page.tsx',
  'src/app/sign-up/[[...sign-up]]/page.tsx',
  'src/app/dashboard/page.tsx',
]

requiredFiles.forEach((file) => {
  const filePath = join(rootDir, file)
  if (existsSync(filePath)) {
    checks.push({ status: '✅', message: `${file} exists` })
  } else {
    checks.push({ status: '❌', message: `${file} missing` })
    hasErrors = true
  }
})

// Check 3: Clerk package installed
const packageJsonPath = join(rootDir, 'package.json')
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  if (packageJson.dependencies?.['@clerk/nextjs']) {
    checks.push({
      status: '✅',
      message: `@clerk/nextjs installed (${packageJson.dependencies['@clerk/nextjs']})`,
    })
  } else {
    checks.push({ status: '❌', message: '@clerk/nextjs not installed' })
    checks.push({ status: 'ℹ️', message: 'Run: pnpm add @clerk/nextjs' })
    hasErrors = true
  }
}

// Print results
checks.forEach(({ status, message }) => {
  console.log(`${status} ${message}`)
})

console.log()

if (hasErrors) {
  console.log('❌ Setup incomplete. Please fix the errors above.\n')
  console.log('Documentation:')
  console.log('  - docs/auth-setup.md (comprehensive guide)')
  console.log('  - docs/auth-patterns.md (quick reference)\n')
  process.exit(1)
} else {
  console.log('✅ Clerk authentication setup complete!\n')
  console.log('Next steps:')
  console.log('  1. Configure OAuth providers in Clerk Dashboard')
  console.log('  2. Run: pnpm --filter web dev')
  console.log('  3. Visit http://localhost:3000\n')
  process.exit(0)
}
