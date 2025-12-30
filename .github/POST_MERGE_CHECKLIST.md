# Post-Merge Checklist - CI/CD Setup

Complete these steps after merging the CI/CD implementation to activate all features.

## Immediate Actions (Required)

### 1. Configure Branch Protection Rules

**For `main` branch:**

1. Navigate to: **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Enable these settings:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Status checks that are required: **CI Success**
   - ✅ Require conversation resolution before merging
   - ❌ Allow force pushes: Disabled
   - ❌ Allow deletions: Disabled
4. Click **Create** or **Save changes**

**For `develop` branch:**

1. Repeat above steps with branch name pattern: `develop`
2. Same settings as `main`

### 2. Add Repository Secrets (If Using Clerk)

1. Navigate to: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | From Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | `sk_live_...` | From Clerk Dashboard → API Keys |

**Note:** If not using Clerk yet, CI will use placeholder values automatically.

### 3. Update README.md

Add CI status badge to project README:

```markdown
# MCQuest Designer

[![CI Status](https://github.com/YOUR_USERNAME/mcquest_designer/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/mcquest_designer/actions/workflows/ci.yml)

FTB Quests Web Platform for Minecraft 1.21.x
```

Replace `YOUR_USERNAME` with actual GitHub username/organization.

### 4. Update Dependabot Configuration

Edit `.github/dependabot.yml` and replace placeholders:

```yaml
reviewers:
  - "YOUR_GITHUB_USERNAME"  # ← Replace this
assignees:
  - "YOUR_GITHUB_USERNAME"  # ← Replace this
```

## Optional Enhancements

### 5. Configure Notifications

**Personal GitHub Settings:**

1. Navigate to: **Settings** (personal) → **Notifications**
2. Under **Actions**:
   - ✅ Email notifications: Only failed workflows
   - ✅ Web notifications: Enabled
3. Save preferences

**Team Notifications (if using Slack/Discord):**

- Install GitHub app in workspace
- Configure workflow notifications channel

### 6. Enable GitHub Actions Caching

**Check cache storage:**

1. Navigate to: **Settings** → **Actions** → **Caches**
2. Verify caches are being created after first CI run
3. Monitor cache size and hit rates

**Clean old caches (if needed):**

```bash
gh cache list
gh cache delete <cache-id>
```

### 7. Configure Dependabot Auto-Merge (Optional)

For automated dependency updates:

1. Install GitHub CLI: `gh auth login`
2. Enable auto-merge for Dependabot PRs:

```bash
gh repo set-default YOUR_USERNAME/mcquest_designer

# Auto-merge patch/minor updates
gh pr merge --auto --squash <pr-number>
```

Or create a GitHub Actions workflow for automatic merging.

## Verification Steps

### 8. Test CI Pipeline

**Create a test PR:**

```bash
# Create test branch
git checkout -b test/ci-verification
git commit --allow-empty -m "test: verify CI pipeline"
git push -u origin test/ci-verification

# Create PR
gh pr create --title "test: CI verification" --body "Testing CI pipeline"
```

**Verify:**
- ✅ CI workflow triggers automatically
- ✅ All jobs run in parallel
- ✅ Jobs complete in <5 minutes (first run)
- ✅ Status checks appear on PR
- ✅ "CI Success" check is required for merge
- ✅ Cache hit rates visible in logs

**Clean up:**

```bash
gh pr close <pr-number>
git checkout develop
git branch -D test/ci-verification
```

### 9. Test Branch Protection

**Attempt to push directly to `main` (should fail):**

```bash
git checkout main
git commit --allow-empty -m "test: should be blocked"
git push  # Should fail with protection error
```

Expected error:
```
remote: error: GH006: Protected branch update failed
```

### 10. Monitor First Production Run

After first real PR:

1. Check workflow run time
2. Review cache hit rates in logs
3. Verify artifacts uploaded (coverage reports)
4. Check for any warnings or issues

## Team Onboarding

### 11. Update Team Documentation

Share these resources with team:

- `.github/CI_QUICK_REFERENCE.md` - Quick command reference
- `.github/workflows/README.md` - Workflow documentation
- `docs/ci-cd-overview.md` - Complete CI/CD guide

### 12. Team Training Points

Key points to communicate:

1. **Local validation before push:**
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```

2. **PR workflow:**
   - Create feature branch from `develop`
   - Push changes
   - CI runs automatically
   - All checks must pass before merge

3. **Debugging failed CI:**
   - Check Actions tab for logs
   - Run same commands locally
   - Review `.github/CI_QUICK_REFERENCE.md`

4. **Dependabot PRs:**
   - Review weekly dependency updates
   - Merge after CI passes
   - Test locally if major version updates

## Monitoring and Maintenance

### 13. Regular Checks (Weekly)

- [ ] Review CI run times (trend analysis)
- [ ] Check cache hit rates (should be >80%)
- [ ] Review Dependabot PRs
- [ ] Monitor workflow failure rates

### 14. Monthly Maintenance

- [ ] Update GitHub Actions versions (if new versions available)
- [ ] Review and update `.github/workflows/README.md`
- [ ] Clean up old caches (if storage limit reached)
- [ ] Review and update secrets (if rotated)

### 15. Quarterly Review

- [ ] Evaluate CI performance metrics
- [ ] Consider additional quality gates (coverage thresholds, etc.)
- [ ] Review and update documentation
- [ ] Plan enhancements (E2E tests, deploy previews, etc.)

## Troubleshooting

### Common Issues

**Issue: CI not triggering on push**
- Verify workflow file syntax: `.github/scripts/validate-workflows.sh`
- Check branch name matches trigger patterns
- Verify GitHub Actions enabled: **Settings** → **Actions** → **General**

**Issue: Status check not appearing on PR**
- Wait 1-2 minutes for workflow to start
- Verify workflow has `pull_request` trigger
- Check workflow run in Actions tab

**Issue: Required status check blocking merge but no workflow ran**
- Rename status check in branch protection to match workflow job name
- Ensure workflow runs on target branch

**Issue: Slow CI runs**
- Check cache hit rates in logs
- Verify Turbo configuration in `turbo.json`
- Review job parallelization

## Support Resources

- **Workflow Logs:** GitHub → Actions → CI → Select run
- **Quick Reference:** `.github/CI_QUICK_REFERENCE.md`
- **Full Documentation:** `docs/ci-cd-overview.md`
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Turbo Docs:** https://turbo.build/repo/docs

## Rollback Plan

If CI causes issues:

1. **Disable workflow temporarily:**
   ```bash
   # Rename workflow to disable
   git mv .github/workflows/ci.yml .github/workflows/ci.yml.disabled
   git commit -m "chore: temporarily disable CI"
   git push
   ```

2. **Remove branch protection:**
   - Settings → Branches → Edit rule
   - Uncheck "Require status checks"
   - Save (temporary, for emergency merges)

3. **Investigate and fix:**
   - Review workflow logs
   - Test changes locally
   - Re-enable when fixed

---

## Completion Checklist

Mark completed items:

- [ ] Branch protection configured (`main`)
- [ ] Branch protection configured (`develop`)
- [ ] Repository secrets added (if needed)
- [ ] README.md updated with status badge
- [ ] Dependabot reviewers updated
- [ ] Notifications configured
- [ ] Test PR created and verified
- [ ] Branch protection tested
- [ ] Team onboarded
- [ ] Monitoring plan established

---

**Post these steps, the CI/CD infrastructure is fully operational!**
