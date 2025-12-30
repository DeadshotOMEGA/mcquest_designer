# Git Workflow

This project uses **Git Flow** for branch management.

## Branch Structure

| Branch      | Purpose                             | Protected |
| ----------- | ----------------------------------- | --------- |
| `main`      | Production releases                 | Yes       |
| `develop`   | Integration branch, default for PRs | Yes       |
| `feature/*` | New features                        | No        |
| `release/*` | Release preparation                 | No        |
| `hotfix/*`  | Emergency production fixes          | No        |

## Branch Diagram

```
main     ●────────────────────────●────────────────● (releases)
          \                        ↑                ↑
           \                      /                /
develop     ●──●──●──●──●──●──●──●──●──●──●──●──●──● (integration)
               \     /    \        /
                \   /      \      /
feature/auth     ●─●        \    /
                             \  /
feature/editor                ●─●
```

## Workflow

### Starting a New Feature

```bash
# Ensure you're on develop and up-to-date
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature...
git add .
git commit -m "feat: description of changes"

# Push feature branch
git push -u origin feature/your-feature-name

# Create PR to develop
gh pr create --base develop --title "feat: Your Feature" --body "Description"
```

### Feature Branch Naming

Use descriptive names that reference the milestone/task when applicable:

```
feature/m1-monorepo-setup
feature/m2-react-flow-integration
feature/auth-clerk-integration
feature/export-snbt-compiler
```

### Completing a Feature

1. Create PR from `feature/*` → `develop`
2. Pass CI checks
3. Get review (if applicable)
4. Squash merge to develop
5. Delete feature branch

### Preparing a Release

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# Bump versions, update changelog
# Test thoroughly

# Merge to main
git checkout main
git merge release/v1.0.0
git tag v1.0.0
git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/v1.0.0
git push origin develop

# Delete release branch
git branch -d release/v1.0.0
```

### Hotfixes

For urgent production fixes:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Fix the issue
git commit -m "fix: critical bug description"

# Merge to main
git checkout main
git merge hotfix/critical-bug-fix
git tag v1.0.1
git push origin main --tags

# Merge to develop
git checkout develop
git merge hotfix/critical-bug-fix
git push origin develop
```

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type       | Description                              |
| ---------- | ---------------------------------------- |
| `feat`     | New feature                              |
| `fix`      | Bug fix                                  |
| `docs`     | Documentation changes                    |
| `style`    | Code style (formatting, no logic change) |
| `refactor` | Code refactoring                         |
| `test`     | Adding/updating tests                    |
| `chore`    | Maintenance tasks                        |

### Examples

```
feat(editor): add quest node drag-and-drop
fix(export): correct SNBT string escaping
docs: update README with setup instructions
refactor(schema): simplify ProjectSnapshot validation
test(export): add golden export comparison tests
chore: update dependencies
```

## PR Guidelines

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why
3. **Size**: Keep PRs focused and reviewable
4. **Tests**: Include relevant tests
5. **Docs**: Update docs if behavior changes

## Branch Protection (Recommended)

Configure these rules on GitHub:

### `main` branch

- Require PR reviews
- Require status checks to pass
- No direct pushes
- No force pushes

### `develop` branch

- Require status checks to pass
- Allow squash merging only
