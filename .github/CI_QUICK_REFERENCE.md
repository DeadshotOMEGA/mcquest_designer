# CI Quick Reference

Fast reference for common CI/CD tasks and troubleshooting.

## Running CI Checks Locally

```bash
# Run all checks (same as CI)
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# Run checks in parallel (faster)
pnpm lint & pnpm typecheck & pnpm test & wait && pnpm build

# Individual checks
pnpm lint              # Code style and quality
pnpm typecheck         # TypeScript validation
pnpm test              # Test suite
pnpm build             # Build all packages
pnpm format:check      # Check formatting
```

## Fixing Common Issues

### Fix Formatting

```bash
pnpm format
```

### Clear Caches and Rebuild

```bash
pnpm clean
rm -rf node_modules .turbo
pnpm install
pnpm build
```

### Update Snapshots (Tests)

```bash
pnpm --filter export test -- -u
```

## CI Workflow Status

### Check Status

- View in GitHub: **Actions** → **CI** workflow
- Badge: `[![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/ci.yml)`

### Re-run Failed Jobs

1. Go to failed workflow run
2. Click "Re-run failed jobs" (top-right)

### Cancel Running Workflow

1. Go to running workflow
2. Click "Cancel workflow" (top-right)

## Branch Protection

### Required Status Check

- Check name: **CI Success**
- Configure in: **Settings** → **Branches** → **Branch protection rules**

## Secrets Configuration

### Add Secrets

1. **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret"

### Required Secrets (Production)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## Dependabot

### Configuration

- File: `.github/dependabot.yml`
- Schedule: Weekly (Mondays 9:00 AM)

### Merge Dependency Updates

```bash
# Review PR, then merge via GitHub UI
# Or using gh CLI:
gh pr merge <pr-number> --auto --squash
```

## Troubleshooting

### CI Fails on `pnpm install`

**Cause:** Lockfile out of sync
**Fix:**

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "fix: update lockfile"
```

### CI Fails on Build (Clerk Keys)

**Cause:** Missing secrets
**Fix:** Add secrets to repository (see above) or CI will use placeholders

### CI Passes Locally, Fails in GitHub

**Common Causes:**

- Uncommitted files
- Case-sensitive file paths (Linux vs Windows/Mac)
- Environment variables

**Fix:**

```bash
git status  # Check for uncommitted changes
git add .
git commit -m "fix: commit missing files"
```

### Turbo Cache Not Working

**Check:**

```bash
# View cache status in CI logs
# Look for: "cache hit" or "cache miss"
```

**Fix:**

```bash
# Clear cache (GitHub Actions)
# Settings → Actions → Caches → Delete cache
```

## Performance Tips

### Speed Up CI

1. **Use cached dependencies** - Already configured
2. **Minimize file changes** - Smaller diffs = faster checks
3. **Commit frequently** - Smaller incremental builds
4. **Enable concurrency** - Already configured

### Optimize Build Time

```bash
# Use Turbo's daemon for local builds
turbo run build --daemon

# Skip unchanged packages (automatic with Turbo)
turbo run build  # Only rebuilds changed packages
```

## Pull Request Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes and Test Locally

```bash
# Make changes...
pnpm lint
pnpm typecheck
pnpm test
```

### 3. Commit and Push

```bash
git add .
git commit -m "feat: add new feature"
git push -u origin feature/my-feature
```

### 4. Create PR

```bash
gh pr create --base develop --title "feat: add new feature" --body "Description"
# Or use GitHub UI
```

### 5. Wait for CI

- All jobs must pass before merge
- Review CI logs if failures occur

### 6. Merge

```bash
gh pr merge --squash  # Or via GitHub UI
```

## Emergency Fixes

### Skip CI (Not Recommended)

```bash
# Add [skip ci] to commit message
git commit -m "docs: update README [skip ci]"
```

**Use only for:** Documentation changes, README updates

### Force Merge (Requires Admin)

Not recommended. Fix CI instead.

## Monitoring

### View Workflow History

```bash
gh run list --workflow=ci.yml --limit 10
```

### View Specific Run

```bash
gh run view <run-id>
```

### Download Artifacts

```bash
gh run download <run-id>
```

## Getting Help

### Check Workflow Logs

1. Go to failed run
2. Click on failed job
3. Expand failed step
4. Review error messages

### Common Error Patterns

**ESLint Errors:**

```
Error: ESLint found 3 errors
```

→ Run `pnpm lint` locally and fix

**Type Errors:**

```
Error: TS2322: Type 'X' is not assignable to type 'Y'
```

→ Run `pnpm typecheck` locally and fix

**Test Failures:**

```
FAIL packages/export/src/__tests__/compiler.test.ts
```

→ Run `pnpm test` locally and fix

**Build Failures:**

```
Error: Missing environment variable
```

→ Add secret to GitHub repository

## Resources

- [CI/CD Overview](/docs/ci-cd-overview.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Turbo Docs](https://turbo.build/repo/docs)
- [pnpm Docs](https://pnpm.io/)
