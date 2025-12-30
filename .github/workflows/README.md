# GitHub Actions Workflows

This directory contains CI/CD workflows for the MCQuest Designer project.

## Workflows

### CI Workflow (`ci.yml`)

Runs on every push and pull request to validate code quality, type safety, tests, and buildability.

**Triggers:**

- Push to `main`, `develop`, `feature/*`, `release/*`, `hotfix/*`
- Pull requests to `main` and `develop`

**Jobs (run in parallel):**

1. **Lint** - Validates code style and formatting
   - Runs ESLint across all workspaces
   - Checks Prettier formatting
   - Fails on any lint errors or formatting inconsistencies

2. **Type Check** - Validates TypeScript types
   - Runs `tsc --noEmit` across all packages
   - Ensures no type errors in monorepo

3. **Test** - Runs test suite
   - Executes Vitest tests in `packages/export`
   - Uploads coverage reports as artifacts (7-day retention)

4. **Build** - Builds all packages
   - Builds TypeScript packages (`schema`, `export`)
   - Builds Next.js web application
   - Caches Turbo outputs for faster subsequent runs
   - Uses placeholder Clerk keys if secrets not configured

5. **CI Success** - Summary job
   - Requires all jobs to pass
   - Provides single status check for branch protection

## Configuration

### Required Secrets

For production builds, configure these secrets in GitHub repository settings:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key for authentication
- `CLERK_SECRET_KEY` - Clerk secret key for server-side auth

**Note:** CI will use placeholder values if secrets are not configured, allowing builds to succeed in fork/development scenarios.

### Branch Protection

Recommended branch protection rules for `main` and `develop`:

1. Require status checks to pass: `CI Success`
2. Require branches to be up to date
3. Require pull request reviews (1 approver)
4. Dismiss stale reviews on new commits

## Performance Optimizations

### Turbo Caching

- Turbo automatically caches task outputs
- Subsequent runs skip unchanged packages
- Cache stored in `.turbo` directory

### pnpm Caching

- GitHub Actions caches pnpm store using `setup-node`
- Significantly speeds up dependency installation
- Cache key: `${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}`

### Build Output Caching

- Next.js `.next` directory cached between runs
- Package `dist` directories cached
- Reduces build times for unchanged code

### Concurrency Control

- In-progress workflows for the same branch are cancelled
- Prevents resource waste on superseded commits
- Uses: `concurrency.group` with `cancel-in-progress: true`

## Monitoring

### Workflow Status Badge

Add to `README.md`:

```markdown
[![CI Status](https://github.com/YOUR_USERNAME/mcquest_designer/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/mcquest_designer/actions/workflows/ci.yml)
```

### Viewing Results

1. Navigate to **Actions** tab in GitHub repository
2. Select **CI** workflow
3. Click on specific run to see job details
4. Download coverage artifacts from successful test runs

## Troubleshooting

### Build Failures

**Issue:** Next.js build fails with Clerk key errors
**Solution:** Add Clerk secrets to repository settings or use placeholder values (already configured)

**Issue:** Type check fails on local but passes in CI (or vice versa)
**Solution:** Ensure Node.js and pnpm versions match between local and CI (check `package.json` `engines`)

**Issue:** Tests fail in CI but pass locally
**Solution:** Check for environment-specific issues (timezones, file paths, async timing)

### Performance Issues

**Issue:** Slow dependency installation
**Solution:** pnpm caching should resolve this automatically. If persisting, check cache hit rate in logs.

**Issue:** Slow builds despite no code changes
**Solution:** Verify Turbo cache is working correctly. Check `.turbo` directory is being cached.

## Local Validation

Run the same checks locally before pushing:

```bash
# Full CI validation
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# Quick validation (parallel)
pnpm lint & pnpm typecheck & pnpm test & wait
```

## Future Enhancements

Planned improvements:

- **E2E Testing**: Add Playwright tests for web app
- **Security Scanning**: Integrate dependency vulnerability scanning
- **Deploy Previews**: Auto-deploy PR previews to Vercel/Netlify
- **Performance Budgets**: Track bundle size and performance metrics
- **Code Coverage**: Enforce minimum coverage thresholds
