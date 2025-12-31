# UI Components Roadmap

> **Document Type:** Explanation (Diátaxis)
> **Purpose:** Outlines the UI component strategy and integration plan for MCQuest Designer

## Current State

### Base Component Library: shadcn/ui

We currently use [shadcn/ui](https://ui.shadcn.com/) built on Radix UI primitives with Tailwind CSS 4.

**Installed Components** (in `apps/web/src/components/ui/`):
- Badge, Button, Card, Dialog, Input, Label, Separator, Skeleton, Textarea

**Configuration:**
- Style: Default theme
- Base color: Slate
- Icons: Lucide React
- CSS Variables: Enabled
- React Server Components: Enabled

**Supporting Libraries:**
- `class-variance-authority` - Component variants
- `tailwind-merge` + `clsx` - Utility class merging
- `tailwindcss-animate` - Animations

---

## Component Libraries to Integrate

### 1. **Sonner** - Toast Notifications
- **URL:** https://sonner.emilkowal.ski/
- **Purpose:** User feedback for save operations, export status, errors
- **Why:** Better UX than basic toasts, shadcn-compatible styling
- **Use Cases:**
  - Autosave confirmations
  - Export progress/completion
  - Error notifications
  - Undo/redo feedback

### 2. **Vaul** - Drawer Component
- **URL:** https://vaul.emilkowal.ski/
- **Purpose:** Mobile-friendly quest property editors
- **Why:** Better mobile UX than full-screen modals
- **Use Cases:**
  - Quest inspector on mobile/tablet
  - Chapter settings on mobile
  - Quick actions drawer

### 3. **Magic UI** - Animated Components
- **URL:** https://magicui.design/
- **Purpose:** Polish and micro-interactions
- **Why:** Makes UI feel more professional and engaging
- **Use Cases:**
  - Animated buttons for primary actions
  - Loading states with smooth transitions
  - Card hover effects on project cards
  - Text effects for empty states

### 4. **shadcn-extension** - Extended Components
- **URL:** https://github.com/BelkacemYerfa/shadcn-extension
- **Purpose:** Form components not in base shadcn
- **Why:** Maintains consistent patterns with shadcn
- **Use Cases:**
  - Multi-select for quest dependencies
  - File upload for future features
  - Date range picker for version history filtering

### 5. **shadcn/ui Blocks** - Pre-built Sections
- **URL:** https://ui.shadcn.com/blocks
- **Purpose:** Accelerate common UI patterns
- **Why:** Official shadcn patterns, proven designs
- **Use Cases:**
  - Authentication pages (login, signup)
  - Dashboard layouts
  - Settings pages
  - Sidebar navigation

### 6. **Aceternity UI** - Premium Animations (Future)
- **URL:** https://ui.aceternity.com/
- **Purpose:** Landing page and marketing site
- **Why:** High-quality animations for public-facing pages
- **Use Cases:**
  - Landing page hero sections
  - Feature showcases
  - Testimonials/showcase sections

### 7. **Tremor** - Data Visualization (Future)
- **URL:** https://www.tremor.so/
- **Purpose:** Analytics dashboards (post-v1)
- **Why:** Built on same foundation (Radix), designed for dashboards
- **Use Cases:**
  - Project usage analytics
  - Quest complexity metrics
  - Export statistics

---

## Implementation Priority

### P0: Critical for M2 (Editor)
**Target:** M2 milestone completion

| Component | Library | Reason | Issues |
|-----------|---------|--------|--------|
| Toast notifications | Sonner | Essential UX feedback | #66 |
| Mobile drawer | Vaul | Mobile-first quest inspector | #67 |

### P1: High Value for M2
**Target:** During M2 development

| Component | Library | Reason | Issues |
|-----------|---------|--------|--------|
| Animated buttons/cards | Magic UI | Professional polish | #68 |
| Multi-select | shadcn-extension | Quest dependencies UI | #69 |
| Auth/dashboard blocks | shadcn Blocks | Accelerate development | #70 |

### P2: Nice to Have
**Target:** M3-M4 timeframe

| Component | Library | Reason | Issues |
|-----------|---------|--------|--------|
| Landing page animations | Aceternity UI | Marketing site polish | #71 |
| File upload | shadcn-extension | Future import features | - |

### P3: Future Milestones
**Target:** Post-v1 (M6+)

| Component | Library | Reason | Issues |
|-----------|---------|--------|--------|
| Charts/dashboards | Tremor | Analytics features | - |
| Date range picker | shadcn-extension | Advanced version history | - |

---

## Integration Approach

### Installation Pattern

All libraries follow shadcn's copy-paste philosophy:

```bash
# Example: Sonner
pnpm add sonner

# Then copy component code into project
# Customize as needed
```

### Directory Structure

```
apps/web/src/components/
├── ui/                      # Base shadcn components
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── extended/                # Extended/custom components
│   ├── toast.tsx           # Sonner wrapper
│   ├── drawer.tsx          # Vaul wrapper
│   ├── multi-select.tsx    # shadcn-extension
│   └── ...
├── animated/                # Magic UI / Aceternity components
│   ├── animated-button.tsx
│   ├── spotlight-card.tsx
│   └── ...
└── blocks/                  # shadcn Blocks compositions
    ├── auth-form.tsx
    ├── sidebar-nav.tsx
    └── ...
```

### Styling Consistency

**Principles:**
1. Use existing Tailwind config (Slate base color)
2. Respect CSS variables defined in `globals.css`
3. Match existing component variant patterns (using CVA)
4. Ensure dark mode compatibility (when implemented)

**Example Integration:**
```tsx
// apps/web/src/components/extended/toast.tsx
import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      theme="light"
      className="toaster"
      toastOptions={{
        classNames: {
          toast: 'bg-background text-foreground border-border',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
        },
      }}
    />
  )
}
```

### TypeScript Integration

**Requirements:**
- All components must have proper TypeScript types
- No `any` types (strict mode compliance)
- Extend existing HTML element props where applicable
- Export prop interfaces for composition

**Example:**
```tsx
import type { ComponentPropsWithoutRef } from 'react'

interface AnimatedButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'default' | 'shimmer' | 'shine'
  size?: 'sm' | 'md' | 'lg'
}

export function AnimatedButton({ variant = 'default', ...props }: AnimatedButtonProps) {
  // Implementation
}
```

---

## Visual Component Hierarchy

```
MCQuest Designer UI Stack
│
├─ Layout & Navigation
│  ├─ shadcn Blocks (sidebar, nav)
│  └─ shadcn/ui (separator)
│
├─ Editor Canvas
│  ├─ React Flow (graph)
│  ├─ shadcn/ui (button, card)
│  └─ Magic UI (animated states)
│
├─ Inspector Panel
│  ├─ Desktop: shadcn/ui (dialog, input, textarea)
│  ├─ Mobile: Vaul (drawer)
│  ├─ Forms: shadcn-extension (multi-select)
│  └─ Feedback: Sonner (toasts)
│
├─ Dashboard
│  ├─ shadcn Blocks (dashboard layout)
│  ├─ shadcn/ui (card, badge, skeleton)
│  └─ Magic UI (animated cards)
│
├─ Landing Page (Future)
│  ├─ Aceternity UI (hero, features)
│  └─ Magic UI (text effects)
│
└─ Analytics (Future)
   └─ Tremor (charts, KPIs, tables)
```

### Library → Application Mapping

| App Section | Primary Library | Secondary |
|-------------|----------------|-----------|
| Authentication | shadcn Blocks | shadcn/ui |
| Dashboard | shadcn/ui + Magic UI | Blocks |
| Graph Editor | React Flow + shadcn/ui | Magic UI |
| Quest Inspector (Desktop) | shadcn/ui | shadcn-extension |
| Quest Inspector (Mobile) | Vaul | shadcn/ui |
| Notifications | Sonner | - |
| Landing Page | Aceternity UI | Magic UI |
| Analytics | Tremor | shadcn/ui |

---

## Success Criteria

### Design System Consistency
- [ ] All new components use existing CSS variables
- [ ] Color palette remains consistent (Slate base)
- [ ] Typography matches existing scale
- [ ] Spacing follows Tailwind scale
- [ ] Animation timing is consistent

### Technical Requirements
- [ ] TypeScript strict mode compliance
- [ ] No `any` types
- [ ] Proper prop interfaces exported
- [ ] Tree-shakeable imports
- [ ] No bundle size regression >10%

### Accessibility (WCAG 2.1 Level AA)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Color contrast ratios meet standards
- [ ] ARIA attributes where needed

### Responsive Design
- [ ] Mobile (320px+): Works on small screens
- [ ] Tablet (768px+): Optimized layouts
- [ ] Desktop (1024px+): Full feature set
- [ ] Touch targets minimum 44x44px

### Performance
- [ ] Lighthouse score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] No layout shift (CLS <0.1)

### Developer Experience
- [ ] Clear TypeScript intellisense
- [ ] Documented component props
- [ ] Storybook examples (future)
- [ ] Copy-paste friendly

---

## Migration Strategy

### Phase 1: Foundation (M2 Start)
1. Install Sonner and create toast provider
2. Add Vaul for mobile drawer
3. Update existing components to use toast notifications
4. Test on mobile devices

### Phase 2: Enhancement (M2 Mid)
1. Integrate Magic UI animated components
2. Add multi-select from shadcn-extension
3. Replace placeholder animations
4. Polish loading states

### Phase 3: Acceleration (M2 End)
1. Integrate shadcn Blocks for common patterns
2. Refactor auth pages using blocks
3. Standardize dashboard layouts
4. Document component usage

### Phase 4: Future (Post-M2)
1. Add Aceternity UI for landing page
2. Integrate Tremor for analytics
3. Additional shadcn-extension components as needed

---

## Maintenance Plan

### Keeping Components Updated

1. **Monitor upstream changes:**
   - Watch shadcn/ui releases
   - Track component library updates
   - Review breaking changes

2. **Version pinning strategy:**
   - Pin major versions
   - Test minor updates in development
   - Document customizations

3. **Customization tracking:**
   - Comment custom modifications
   - Document why changes were made
   - Consider upstreaming improvements

### Component Audit Schedule

- **Monthly:** Review new shadcn/ui components
- **Quarterly:** Check for library updates
- **Per milestone:** Evaluate new component needs

---

## References

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Component Libraries List](https://github.com/shadcn-ui/ui/discussions/categories/show-and-tell)

---

_Last updated: 2025-12-30_
