# UI/UX Testing Checklist

Use this checklist to verify the UI/UX refinements before demo or production deployment.

---

## Phase 1: Dashboard Visual Fixes

### Dashboard Page
- [ ] Navigate to `/dashboard`
- [ ] Verify "View All Commissions" button is NOT full-width
- [ ] Button should be auto-width with proper padding

### Recent Deals Widget
**With No Deals:**
- [ ] Clear all deals from database temporarily
- [ ] Verify empty state shows:
  - [ ] FileText icon (document icon)
  - [ ] Title: "No deals yet"
  - [ ] Description: "Create your first deal to get started tracking sales and commissions."
  - [ ] Button: "Create Deal" linking to `/deals/new`
- [ ] Verify "View All Deals" button does NOT appear

**With Deals:**
- [ ] Add deals to database
- [ ] Verify table shows with deal data
- [ ] Verify "View All Deals" button appears below table
- [ ] Button should be auto-width (NOT full-width)
- [ ] Click button to verify it navigates to `/deals`

### Recruiting Pipeline Widget
**With No Recruits:**
- [ ] Remove all recruits temporarily
- [ ] Verify empty state shows:
  - [ ] Users icon (people icon)
  - [ ] Title: "No recruits yet"
  - [ ] Description: "Start building your team by adding recruits to your pipeline."
  - [ ] Button: "View Pipeline" linking to `/recruiting`
- [ ] Verify "View Pipeline" button does NOT appear

**With Recruits:**
- [ ] Add recruits to database
- [ ] Verify pipeline stages show with counts
- [ ] Verify "View Pipeline" button appears below stages
- [ ] Button should be auto-width (NOT full-width)
- [ ] Click button to verify it navigates to `/recruiting`

---

## Phase 2: Deal Edit Page

### Access Edit Page
- [ ] Navigate to `/deals`
- [ ] Click on any deal to go to detail page
- [ ] Verify "Edit Deal" button appears (requires EDIT_DEALS permission)
- [ ] Click "Edit Deal" button
- [ ] Verify redirects to `/deals/[id]/edit`

### Edit Page Layout
- [ ] Verify breadcrumb navigation: Deals / Deal #[id] / Edit
- [ ] Verify page title: "Edit Deal"
- [ ] Verify description: "Update deal information, customer details, and commission assignments."

### Edit Form Pre-population
- [ ] Verify all fields are pre-populated with existing deal data:
  - [ ] Deal Type (Solar/HVAC/Roofing)
  - [ ] Status (Sold/Pending/Cancelled)
  - [ ] System Size (kW)
  - [ ] Deal Value
  - [ ] Sale Date
  - [ ] Close Date
  - [ ] Customer Name
  - [ ] Customer Email
  - [ ] Customer Address
  - [ ] Customer Phone
  - [ ] Setter (selected person)
  - [ ] Closer (selected person)
  - [ ] Office (if assigned)

### Edit Form Validation
- [ ] Clear "Deal Type" field
- [ ] Attempt to submit
- [ ] Verify error: "Deal type is required"
- [ ] Clear "Deal Value" field
- [ ] Attempt to submit
- [ ] Verify error: "Deal value is required"
- [ ] Clear "Setter" field
- [ ] Attempt to submit
- [ ] Verify error: "Setter is required"
- [ ] Clear "Closer" field
- [ ] Attempt to submit
- [ ] Verify error: "Closer is required"

### Edit Form Submission
- [ ] Fill all required fields with valid data
- [ ] Change at least one field value
- [ ] Click "Save Changes"
- [ ] Verify loading state: Button shows "Saving..."
- [ ] Verify success toast: "Deal updated successfully"
- [ ] Verify redirects to deal detail page (`/deals/[id]`)
- [ ] Verify detail page shows updated values

### Edit Form Cancel
- [ ] Navigate back to edit page
- [ ] Click "Cancel" button
- [ ] Verify returns to deal detail page without saving

---

## Phase 3: Design System Documentation

### Documentation Exists
- [ ] Open `docs/design-system.md`
- [ ] Verify file exists and is comprehensive

### Documentation Sections
- [ ] Overview section present
- [ ] Color Palette section with OKLCH values
- [ ] Semantic colors documented (Primary, Success, Warning, Info, Destructive)
- [ ] Typography section with font sizes and weights
- [ ] Spacing section with spacing scale
- [ ] Components section with examples for:
  - [ ] Button (variants and sizes)
  - [ ] Badge (all variants)
  - [ ] Card (with header/content/footer)
  - [ ] Table
  - [ ] Form components
  - [ ] EmptyState
  - [ ] LoadingSpinner
  - [ ] Toast
- [ ] Form patterns documented
- [ ] Layout patterns documented
- [ ] Responsive design patterns
- [ ] Accessibility guidelines
- [ ] Best practices (Do's and Don'ts)
- [ ] Code examples are valid and copy-pasteable

### Tailwind Config
- [ ] Open `tailwind.config.ts`
- [ ] Verify all color tokens are extended:
  - [ ] background, foreground
  - [ ] card, card-foreground
  - [ ] primary, primary-foreground
  - [ ] secondary, secondary-foreground
  - [ ] muted, muted-foreground
  - [ ] accent, accent-foreground
  - [ ] destructive, destructive-foreground
  - [ ] success, success-foreground
  - [ ] warning, warning-foreground
  - [ ] info, info-foreground
  - [ ] border, input, ring
  - [ ] chart-1 through chart-6

---

## Phase 4: Consistency Review

### Page Layout Consistency
Check the following pages for consistent layout:

**Dashboard (`/dashboard`)**
- [ ] Uses `mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8`
- [ ] Title uses `text-2xl font-semibold tracking-tight text-foreground`
- [ ] Description uses `mt-1 text-sm text-muted-foreground`

**People List (`/people`)**
- [ ] Same layout pattern as dashboard
- [ ] Consistent title and description styling
- [ ] Table uses standard Table component

**People Detail (`/people/[id]`)**
- [ ] Breadcrumb navigation present
- [ ] Cards use `p-6` padding
- [ ] Consistent spacing between sections

**Recruiting (`/recruiting`)**
- [ ] Same layout pattern
- [ ] Kanban board or table view toggle works
- [ ] Empty states use EmptyState component

**Deals List (`/deals`)**
- [ ] Same layout pattern
- [ ] "New Deal" button present
- [ ] Table with filters

**Deal Create (`/deals/new`)**
- [ ] Breadcrumb navigation
- [ ] Form cards with `text-lg` titles
- [ ] Two-column responsive grid

**Deal Detail (`/deals/[id]`)**
- [ ] Breadcrumb navigation
- [ ] Edit button present (with permission)
- [ ] Commission breakdown table

**Deal Edit (`/deals/[id]/edit`)**
- [ ] Breadcrumb navigation
- [ ] Form matches create page style

**Commissions (`/commissions`)**
- [ ] Uses `mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8` (FIXED)
- [ ] Summary cards at top
- [ ] Tabs for different views

**Org Chart (`/org-chart`)**
- [ ] Toggle between tree and list view
- [ ] Consistent card styling

**Settings Pages (`/settings/*`)**
- [ ] Sidebar navigation
- [ ] Each page has consistent layout
- [ ] Modals for CRUD operations

**Payroll (`/payroll`)**
- [ ] Date range picker
- [ ] Summary cards
- [ ] Export and mark paid buttons

### Color Consistency
- [ ] Run search for hardcoded colors:
  ```bash
  grep -r "bg-\[#" app/ components/ --include="*.tsx"
  grep -r "text-\[#" app/ components/ --include="*.tsx"
  grep -r "border-\[#" app/ components/ --include="*.tsx"
  ```
- [ ] Verify NO results (all colors use semantic tokens)

### Typography Consistency
- [ ] Page titles use `text-2xl font-semibold`
- [ ] Card titles use `text-lg font-semibold`
- [ ] Body text uses `text-sm`
- [ ] Labels use `text-xs text-muted-foreground`

### Spacing Consistency
- [ ] Page padding: `px-4 py-8 sm:px-6 lg:px-8`
- [ ] Card padding: `p-6`
- [ ] Section gaps: `gap-6` or `space-y-6`
- [ ] Form field spacing: `space-y-4`

### Component Consistency

**Buttons:**
- [ ] Primary actions use default variant
- [ ] Secondary actions use outline or secondary variant
- [ ] Destructive actions use destructive variant
- [ ] No unnecessary `w-full` classes

**Badges:**
- [ ] Status badges use semantic variants:
  - [ ] Success = green (approved, active, sold)
  - [ ] Warning = orange (pending, onboarding)
  - [ ] Destructive = red (rejected, terminated, cancelled)
  - [ ] Info = cyan (informational states)

**Cards:**
- [ ] All use consistent `bg-card border border-border rounded-lg shadow-sm`
- [ ] CardHeader, CardContent, CardFooter used appropriately
- [ ] Titles use CardTitle component

**Tables:**
- [ ] All use Table, TableHeader, TableBody, TableRow, TableCell
- [ ] Hover states: `hover:bg-muted/50`
- [ ] Text sizes: TableHead uses `text-xs`, cells use `text-sm`

**Forms:**
- [ ] All use FormField component
- [ ] Required fields marked with asterisk
- [ ] Inline error messages below fields
- [ ] Submit buttons disable when invalid
- [ ] Loading state shows on submit

**Empty States:**
- [ ] All empty data views use EmptyState component
- [ ] Each has icon, title, description, and optional action
- [ ] Icons are 10x10 (`h-10 w-10`)

**Loading States:**
- [ ] Pages use LoadingSpinner component
- [ ] Async buttons show loading text ("Loading...", "Saving...")
- [ ] Disabled state during loading

**Toasts:**
- [ ] Success toasts for successful operations
- [ ] Error toasts for failures (NOT alerts)
- [ ] Toasts auto-dismiss
- [ ] Top-right positioning

### Responsive Testing

**Mobile (375px)**
- [ ] Dashboard: Stat cards stack (1 column)
- [ ] Dashboard: Widgets stack vertically
- [ ] Forms: Fields stack (1 column)
- [ ] Tables: Horizontal scroll or card view
- [ ] Navigation: Mobile menu works
- [ ] Modals: Full-width on mobile

**Tablet (768px)**
- [ ] Dashboard: Stat cards 2 columns
- [ ] Dashboard: Widgets side-by-side
- [ ] Forms: 2 columns where appropriate
- [ ] Tables: Visible without scroll
- [ ] Navigation: Works properly

**Desktop (1280px+)**
- [ ] Dashboard: Stat cards 4 columns
- [ ] Dashboard: Optimal layout
- [ ] Forms: 2 columns for efficiency
- [ ] Tables: Full width with all columns
- [ ] Navigation: Full menu visible

### Accessibility Testing

**Keyboard Navigation:**
- [ ] Tab through all interactive elements
- [ ] Enter submits forms
- [ ] Escape closes modals
- [ ] Arrow keys work in dropdowns
- [ ] Focus indicators visible on all elements

**ARIA Labels:**
- [ ] Icon-only buttons have aria-label
- [ ] Form errors have role="alert"
- [ ] Loading states have role="status"
- [ ] Tables have proper headers

**Screen Reader:**
- [ ] (Optional) Test with VoiceOver/NVDA
- [ ] All interactive elements announced
- [ ] Form validation errors announced

**Color Contrast:**
- [ ] Text meets WCAG AA standards (4.5:1 for normal text)
- [ ] Interactive elements distinguishable
- [ ] Focus indicators clearly visible

---

## Regression Testing

### Core Functionality
- [ ] User login/logout works
- [ ] Permission guards prevent unauthorized access
- [ ] Data fetching works (no broken API calls)
- [ ] Forms submit and save data
- [ ] Filters work on list pages
- [ ] Search functionality works
- [ ] Sorting works on tables

### Edge Cases
- [ ] Empty data sets show proper empty states
- [ ] Loading states display correctly
- [ ] Error states display with retry options
- [ ] Network failures handled gracefully
- [ ] Invalid form data shows appropriate errors
- [ ] Missing required fields prevent submission

---

## Demo Preparation

### Data Seeding
- [ ] Seed database with realistic sample data
- [ ] Include variety of deal types, statuses, dates
- [ ] Multiple people with different roles
- [ ] Some recruits in various stages
- [ ] Commission data with different statuses
- [ ] Ensure empty states can be demonstrated

### Demo Script
- [ ] Prepare talking points for each feature
- [ ] Highlight empty state improvements
- [ ] Show deal edit functionality
- [ ] Demonstrate design system consistency
- [ ] Show responsive behavior

### Backup Plan
- [ ] Screenshots of key features
- [ ] Video recording of demo
- [ ] Fallback to staging environment if prod fails

---

## Sign-off

### Developer Testing
- [ ] All phases tested
- [ ] No console errors
- [ ] No broken links
- [ ] No visual glitches
- [ ] Responsive at all breakpoints

**Tested by:** ________________
**Date:** ________________

### QA Testing
- [ ] All functionality verified
- [ ] Cross-browser tested
- [ ] Accessibility checked
- [ ] Performance acceptable

**Tested by:** ________________
**Date:** ________________

### Product Review
- [ ] Meets design requirements
- [ ] User experience is smooth
- [ ] Ready for stakeholder demo

**Approved by:** ________________
**Date:** ________________

---

## Notes

Use this section to document any issues found during testing:

---

**Checklist Version:** 1.0
**Last Updated:** 2026-02-02
