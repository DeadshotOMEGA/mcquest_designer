# Clerk + shadcn/ui CLI Integration Analysis

**Date:** 2025-12-30
**Current Setup:** `@clerk/nextjs` with default components
**Recommendation:** Consider migrating to Clerk's shadcn components for M2+

## Overview

Clerk now provides pre-built authentication components through the shadcn CLI that are designed to integrate seamlessly with shadcn/ui-based projects.

**Official Guide:** https://clerk.com/docs/guides/development/shadcn-cli

## Current Implementation vs. Clerk shadcn Components

### Current Setup (MCQuest Designer)

```tsx
// apps/web/src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}

// Sign-in page uses default Clerk components
import { SignIn } from '@clerk/nextjs'
```

**Characteristics:**
- ✅ Simple setup
- ✅ Works out of the box
- ⚠️ Limited customization
- ⚠️ Doesn't match shadcn/ui design system
- ⚠️ Uses Clerk's default styling

### Clerk shadcn Components

```tsx
// With Clerk shadcn components
import { ClerkProvider } from '@/components/clerk-provider'

// Custom sign-in page with shadcn/ui styling
```

**Characteristics:**
- ✅ Matches shadcn/ui design system
- ✅ Fully customizable with shadcn patterns
- ✅ Dark mode support built-in
- ✅ Consistent with project's UI components
- ⚠️ Requires migration from current setup

## Available Clerk shadcn Components

### Quick Start Package
```bash
npx shadcn@latest add @clerk/nextjs-quickstart
```

**Includes:**
- App layout with ClerkProvider
- Sign-in page
- Sign-up page (two-column layout with features)
- Waitlist page
- Middleware configuration
- Header component with auth state
- Theme support (dark/light mode)

### Individual Components

| Component | Command | Purpose |
|-----------|---------|---------|
| Sign-in Page | `npx shadcn@latest add @clerk/nextjs-sign-in-page` | Custom sign-in UI |
| Sign-up Page | `npx shadcn@latest add @clerk/nextjs-sign-up-page` | Two-column sign-up with features |
| ClerkProvider | `npx shadcn@latest add @clerk/nextjs-clerk-provider` | Custom provider wrapper |
| Middleware | `npx shadcn@latest add @clerk/nextjs-middleware` | Route protection config |

## Benefits of Migrating

### 1. Design Consistency
- Auth pages match the rest of the application
- Uses same Button, Card, Input components
- Consistent spacing, colors, typography

### 2. Customization
```tsx
// Can customize sign-in page easily
<Card>
  <CardHeader>
    <CardTitle>Welcome to MCQuest Designer</CardTitle>
    <CardDescription>Design FTB Quests visually</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Custom form with shadcn components */}
  </CardContent>
</Card>
```

### 3. Dark Mode Integration
- Works with existing Tailwind dark mode
- No additional theme configuration needed

### 4. Two-Column Sign-up
Pre-built sign-up page with:
- Left: Form fields
- Right: Feature highlights/selling points

Perfect for showcasing MCQuest Designer features:
- Visual quest editor
- SNBT export
- Version control
- Collaboration

### 5. Production-Ready
- Form validation
- Error handling
- Loading states
- Accessibility (WCAG 2.1 AA)

## Migration Considerations

### Breaking Changes

**Current Routes:**
```
/sign-in/[[...sign-in]]    # Clerk catch-all route
/sign-up/[[...sign-up]]    # Clerk catch-all route
```

**With shadcn components:**
```
/sign-in                   # Custom page
/sign-up                   # Custom page
```

**Impact:** Medium - URLs change, may affect existing bookmarks/links

### Files to Modify

1. **Root Layout** (`src/app/layout.tsx`)
   - Replace `@clerk/nextjs` ClerkProvider with custom one
   - Add theme provider if not present

2. **Sign-in Page** (`src/app/sign-in/[[...sign-in]]/page.tsx`)
   - Replace with custom sign-in component
   - Add branding and custom messaging

3. **Sign-up Page** (`src/app/sign-up/[[...sign-up]]/page.tsx`)
   - Replace with two-column layout
   - Add feature highlights

4. **Middleware** (`src/middleware.ts`)
   - Update with Clerk shadcn middleware config

### Migration Effort

| Task | Effort | Risk |
|------|--------|------|
| Install components | Low | Low |
| Update layout | Low | Low |
| Migrate sign-in page | Medium | Medium |
| Migrate sign-up page | Medium | Medium |
| Test OAuth flows | Medium | Medium |
| Update documentation | Low | Low |

**Total Estimated Time:** 4-6 hours

## Recommended Approach

### Option 1: Migrate Now (Before M2)
**Pros:**
- Clean slate for M2
- Consistent design from start
- Better onboarding UX

**Cons:**
- Delays M2 editor work
- Potential OAuth testing needed
- Risk of breaking existing auth

### Option 2: Migrate During M2
**Pros:**
- Can test alongside editor development
- Opportunity to add feature highlights in sign-up

**Cons:**
- More moving parts during M2
- Potential distraction from editor work

### Option 3: Migrate Post-M2 (Recommended)
**Pros:**
- ✅ Focus on core editor functionality first
- ✅ Current auth works fine
- ✅ Can add feature highlights after features exist
- ✅ Lower risk

**Cons:**
- Auth pages won't match design system initially
- May need to educate users on new auth pages later

## Recommendation: Post-M2 Migration

**Rationale:**
1. **Current auth works** - No blocking issues
2. **M2 is critical path** - Editor is core value proposition
3. **Better feature highlights** - Can showcase actual features after M2 completes
4. **Lower risk** - Don't introduce auth changes during major feature development

**Suggested Timeline:**
- **M1 (Now):** Keep current Clerk implementation ✅
- **M2 (Next):** Focus on editor development
- **M3:** Consider auth migration if time permits
- **M4:** Ideal time - can highlight export features in sign-up

## Implementation Plan (When Ready)

### Step 1: Install Components
```bash
# Install individual components (more control than quickstart)
npx shadcn@latest add @clerk/nextjs-sign-in-page
npx shadcn@latest add @clerk/nextjs-sign-up-page
npx shadcn@latest add @clerk/nextjs-clerk-provider
```

### Step 2: Update Layout
```tsx
// src/app/layout.tsx
import { ClerkProvider } from '@/components/clerk-provider'
import { Toaster } from '@/components/extended/toast'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### Step 3: Customize Sign-up Features
```tsx
// Add to sign-up page right column
const features = [
  {
    icon: Workflow,
    title: 'Visual Quest Editor',
    description: 'Drag-and-drop interface powered by React Flow'
  },
  {
    icon: FileDown,
    title: 'SNBT Export',
    description: 'Generate FTB Quests-compatible files'
  },
  {
    icon: History,
    title: 'Version Control',
    description: 'Never lose work with automatic versioning'
  },
  {
    icon: Share2,
    title: 'Collaboration',
    description: 'Share projects with read-only links'
  }
]
```

### Step 4: Test OAuth Flows
- GitHub sign-in
- Discord sign-in
- Google sign-in
- Email/password

### Step 5: Update Documentation
- Update README with new auth pages
- Update screenshots
- Update onboarding docs

## Testing Checklist

When migrating:
- [ ] GitHub OAuth works
- [ ] Discord OAuth works
- [ ] Google OAuth works
- [ ] Email/password sign-up works
- [ ] Email/password sign-in works
- [ ] Dark mode toggles correctly
- [ ] Error states display properly
- [ ] Loading states work
- [ ] Redirect after sign-in works
- [ ] Session persistence works
- [ ] Sign-out works
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly

## Resources

- [Clerk shadcn CLI Docs](https://clerk.com/docs/guides/development/shadcn-cli)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## Conclusion

**Current Status:** Auth works fine with default Clerk components

**Migration Value:** Medium-High (design consistency, better UX)

**Recommended Timing:** Post-M2 (M3 or M4 milestone)

**Risk Level:** Medium (requires testing all OAuth flows)

**Effort:** 4-6 hours

**Priority:** Low (nice-to-have, not blocking)

---

**Analyzed by:** Claude Code (ui-components-advisor)
**Status:** Recommendation documented, no immediate action required
