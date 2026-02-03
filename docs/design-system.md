# Design System Documentation

## Overview

This design system provides a cohesive, accessible foundation for the Kin People application. It uses OKLCH color space for better perceptual uniformity and includes dark mode support.

---

## Color Palette

### OKLCH Color System

The application uses OKLCH (Oklab Lightness Chroma Hue) color space for superior perceptual uniformity compared to traditional HSL/RGB. All colors are defined as CSS custom properties in `app/globals.css`.

### Semantic Colors

#### Primary (Blue)
- Used for primary actions, links, and key interactive elements
- Light mode: `oklch(0.581 0.157 252.306)`
- Dark mode: `oklch(0.613 0.145 252.306)`

```tsx
// Usage examples
<Button>Primary Action</Button>
<Link className="text-primary">Click here</Link>
```

#### Success (Green)
- Used for positive states, confirmations, success messages
- Light mode: `oklch(0.545 0.135 147.859)`
- Dark mode: `oklch(0.613 0.135 147.859)`

```tsx
<Badge variant="success">Approved</Badge>
<p className="text-success">Operation successful</p>
```

#### Warning (Orange)
- Used for cautions, warnings, pending states
- Light mode: `oklch(0.686 0.168 59.649)`
- Dark mode: `oklch(0.686 0.168 59.649)`

```tsx
<Badge variant="warning">Pending</Badge>
<p className="text-warning">Review required</p>
```

#### Info (Cyan)
- Used for informational messages and highlights
- Light mode: `oklch(0.586 0.105 196.874)`
- Dark mode: `oklch(0.627 0.105 196.874)`

```tsx
<Badge variant="info">New</Badge>
<p className="text-info">For your information</p>
```

#### Destructive (Red)
- Used for errors, destructive actions, critical warnings
- Light mode: `oklch(0.539 0.194 24.683)`
- Dark mode: `oklch(0.614 0.194 24.683)`

```tsx
<Button variant="destructive">Delete</Button>
<Badge variant="destructive">Error</Badge>
<p className="text-destructive">Something went wrong</p>
```

### Neutral Colors

#### Background & Foreground
- `background`: Page background color
- `foreground`: Primary text color
- `card`: Card/panel background
- `card-foreground`: Text on cards
- `popover`: Popover/dropdown background
- `popover-foreground`: Text in popovers

```tsx
<div className="bg-background text-foreground">
  <Card className="bg-card text-card-foreground">
    Content here
  </Card>
</div>
```

#### Muted
- Used for secondary text, disabled states, subtle backgrounds
- `muted`: Muted background
- `muted-foreground`: Muted text color

```tsx
<p className="text-muted-foreground">Secondary information</p>
<div className="bg-muted p-4">Subtle section</div>
```

#### Border & Input
- `border`: Border color for cards, inputs, dividers
- `input`: Input field border color
- `ring`: Focus ring color

```tsx
<Input className="border-border focus:ring-ring" />
<div className="border border-border rounded-lg">Content</div>
```

### Chart Colors
Six distinct colors for data visualization:
- `chart-1` through `chart-6`

```tsx
// Usage in charts
<Bar dataKey="value" fill="hsl(var(--chart-1))" />
```

### Sidebar Colors (if applicable)
- `sidebar-background`
- `sidebar-foreground`
- `sidebar-primary`
- `sidebar-primary-foreground`
- `sidebar-accent`
- `sidebar-accent-foreground`
- `sidebar-border`
- `sidebar-ring`

---

## Typography

### Font Family
- Default: System font stack for optimal performance
- Defined in `app/layout.tsx`

### Font Sizes

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px (0.75rem) | Labels, captions, small text |
| `text-sm` | 14px (0.875rem) | Body text, form inputs |
| `text-base` | 16px (1rem) | Default body text |
| `text-lg` | 18px (1.125rem) | Card titles, section headers |
| `text-xl` | 20px (1.25rem) | Subsection titles |
| `text-2xl` | 24px (1.5rem) | Page titles |
| `text-3xl` | 30px (1.875rem) | Large headings |

### Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasized text |
| `font-semibold` | 600 | Headings, buttons |
| `font-bold` | 700 | Strong emphasis |

### Typography Patterns

```tsx
// Page title
<h1 className="text-2xl font-semibold tracking-tight text-foreground">
  Page Title
</h1>

// Card title
<CardTitle className="text-lg font-semibold">Card Title</CardTitle>

// Body text
<p className="text-sm text-foreground">Regular body text</p>

// Secondary text
<p className="text-sm text-muted-foreground">Secondary information</p>

// Label
<label className="text-xs text-muted-foreground">Field Label</label>
```

---

## Spacing

### Spacing Scale

Uses Tailwind's default spacing scale (4px base unit):

| Value | Pixels | Usage |
|-------|--------|-------|
| `1` | 4px | Tight spacing |
| `2` | 8px | Small gaps |
| `3` | 12px | Medium gaps |
| `4` | 16px | Standard spacing |
| `6` | 24px | Section spacing |
| `8` | 32px | Large sections |
| `12` | 48px | Extra large spacing |

### Common Spacing Patterns

```tsx
// Page padding
<main className="px-4 py-8 sm:px-6 lg:px-8">

// Card padding
<CardContent className="p-6">

// Section gaps
<div className="space-y-6">

// Form field spacing
<form className="space-y-4">

// Grid gaps
<div className="grid grid-cols-2 gap-4">
```

---

## Components

### Button

Six variants and four sizes:

```tsx
// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Icon className="h-4 w-4" />
</Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading</Button>
```

### Badge

Seven variants for different states:

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="outline">Outline</Badge>
```

### Card

Complete card system with header, content, and footer:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Table

Full table system with consistent styling:

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Form Components

#### FormField with Validation

```tsx
<FormField
  label="Email"
  required
  error={errors.email}
  helpText="Enter your email address"
>
  <Input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="you@example.com"
  />
</FormField>
```

#### Input

```tsx
<Input type="text" placeholder="Enter text..." />
<Input type="email" placeholder="you@example.com" />
<Input type="number" step="0.01" placeholder="0.00" />
<Input type="date" />
```

#### Select

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Checkbox

```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
  <label htmlFor="terms" className="text-sm">
    I agree to the terms
  </label>
</div>
```

#### Textarea

```tsx
<Textarea
  placeholder="Enter description..."
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### Feedback Components

#### LoadingSpinner

```tsx
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />
```

#### EmptyState

```tsx
<EmptyState
  icon={<FileText className="h-10 w-10" />}
  title="No data yet"
  description="Get started by creating your first item."
  action={{
    label: "Create Item",
    href: "/create"
  }}
/>
```

#### Toast Notifications

```tsx
const { success, error, info } = useToast();

// Success notification
success("Item created successfully");

// Error notification
error("Failed to save changes");

// Info notification
info("Your session will expire soon");
```

### Modal/Dialog

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        Modal description text
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Modal content */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Form Patterns

### Validation

All forms should follow these validation patterns:

```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

function validate() {
  const next: Record<string, string> = {};
  if (!email) next.email = "Email is required";
  if (!name) next.name = "Name is required";
  setErrors(next);
  return Object.keys(next).length === 0;
}

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!validate()) return;
  // Submit logic
}
```

### Form Layout

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Section Title</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <FormField label="Field 1" required error={errors.field1}>
        <Input />
      </FormField>
      <FormField label="Field 2">
        <Input />
      </FormField>
    </CardContent>
  </Card>

  <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
    <Button type="button" variant="outline" asChild>
      <Link href="/cancel">Cancel</Link>
    </Button>
    <Button type="submit" disabled={loading}>
      {loading ? "Saving..." : "Save"}
    </Button>
  </div>
</form>
```

### Error Handling

```tsx
// Inline field errors
<FormField label="Email" error={errors.email}>
  <Input type="email" />
</FormField>

// Toast for API errors
const { error: showError } = useToast();
try {
  const res = await fetch("/api/endpoint", { method: "POST" });
  if (!res.ok) {
    const data = await res.json();
    showError(data.error || "Operation failed");
    return;
  }
} catch (err) {
  showError("Network error");
}
```

---

## Layout Patterns

### Page Layout

```tsx
<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <div className="space-y-6">
    {/* Page content */}
  </div>
</main>
```

### Breadcrumbs

```tsx
<nav className="mb-4 text-xs text-muted-foreground" aria-label="Breadcrumb">
  <Link href="/section" className="text-primary hover:underline">
    Section
  </Link>
  <span className="mx-1">/</span>
  <span className="text-foreground">Current Page</span>
</nav>
```

### Grid Layouts

```tsx
// Responsive grid
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
  {/* Grid items */}
</div>

// Two-column form layout
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  {/* Form fields */}
</div>
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Tablets (portrait) |
| `md` | 768px | Tablets (landscape) |
| `lg` | 1024px | Desktops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | Extra large screens |

### Responsive Patterns

```tsx
// Mobile-first approach
<div className="px-4 sm:px-6 lg:px-8">

// Hide on mobile
<div className="hidden md:block">

// Different layouts per breakpoint
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Responsive text sizes
<h1 className="text-xl md:text-2xl lg:text-3xl">
```

---

## Accessibility

### Focus States

All interactive elements have visible focus states using the `ring` color:

```tsx
// Built into components
<Button>Auto-focus state</Button>

// Custom focus rings
<div className="focus:ring-2 focus:ring-ring focus:ring-offset-2">
```

### ARIA Labels

```tsx
// Buttons with icon-only
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Form errors
<p role="alert" className="text-destructive text-sm">
  {error}
</p>

// Loading states
<div role="status" aria-label="Loading">
  <LoadingSpinner />
</div>
```

### Keyboard Navigation

- All interactive elements support Tab navigation
- Dialogs trap focus and support Escape to close
- Dropdowns support Arrow keys for navigation
- Forms support Enter to submit

---

## Dark Mode

Dark mode is automatically supported through CSS variables. All components adapt without code changes.

### Testing Dark Mode

```tsx
// Dark mode is controlled at the root level
// No component-level changes needed
```

---

## Best Practices

### Do's ✅

- Use semantic color tokens (e.g., `bg-card`, `text-foreground`)
- Use spacing scale consistently (`space-y-4`, `gap-6`)
- Include `aria-label` for icon-only buttons
- Show loading states for async operations
- Display errors inline with form fields
- Use EmptyState for empty data lists
- Keep forms simple with clear validation
- Test at all breakpoints

### Don'ts ❌

- Don't use hardcoded hex colors
- Don't mix spacing scales arbitrarily
- Don't use alerts for errors (use toast)
- Don't show blank states without feedback
- Don't disable buttons without indication why
- Don't use color as the only indicator
- Don't forget focus states
- Don't use `w-full` on buttons unless necessary

---

## Future Enhancements

Potential additions to consider:

- Animation utilities (framer-motion)
- Data table component with sorting/filtering
- Multi-step form wizard
- File upload component
- Date range picker
- Rich text editor integration
- Notification center
- Command palette (⌘K)

---

## Support

For questions or issues with the design system:
- Check component examples in `components/ui/`
- Reference this documentation
- Review existing page implementations
- Ask the team in #design-system Slack channel

---

**Last Updated:** 2026-02-02
**Version:** 1.0.0
