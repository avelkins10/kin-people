# Design System Quick Reference

Quick copy-paste guide for common patterns. See `design-system.md` for full documentation.

---

## Page Layout

```tsx
<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <div className="mb-6">
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
      Page Title
    </h1>
    <p className="mt-1 text-sm text-muted-foreground">
      Page description
    </p>
  </div>
  {/* Page content */}
</main>
```

---

## Breadcrumbs

```tsx
<nav className="mb-4 text-xs text-muted-foreground" aria-label="Breadcrumb">
  <Link href="/section" className="text-primary hover:underline">
    Section
  </Link>
  <span className="mx-1">/</span>
  <Link href="/subsection" className="text-primary hover:underline">
    Subsection
  </Link>
  <span className="mx-1">/</span>
  <span className="text-foreground">Current Page</span>
</nav>
```

---

## Buttons

```tsx
// Primary action
<Button>Primary Action</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Loading state
<Button disabled={loading}>
  {loading ? "Saving..." : "Save"}
</Button>

// Icon button
<Button size="icon" aria-label="Close">
  <X className="h-4 w-4" />
</Button>

// Link button
<Button asChild>
  <Link href="/somewhere">Go</Link>
</Button>
```

---

## Badges

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="info">New</Badge>
<Badge variant="outline">Outline</Badge>
```

---

## Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

## Tables

```tsx
<div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
  {data.length === 0 ? (
    <EmptyState
      icon={<Icon className="h-10 w-10" />}
      title="No data"
      description="Add items to see them here."
      action={{ label: "Add Item", href: "/add" }}
    />
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Column 1</TableHead>
          <TableHead>Column 2</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )}
</div>
```

---

## Forms

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Section Title</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <FormField label="Email" required error={errors.email}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </FormField>

      <FormField label="Status">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
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

---

## Empty State

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

// With onClick instead of href
<EmptyState
  icon={<Users className="h-10 w-10" />}
  title="No users"
  description="Add users to your team."
  action={{
    label: "Add User",
    onClick: () => setModalOpen(true)
  }}
/>
```

---

## Loading Spinner

```tsx
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />

// Full page loading
<div className="flex items-center justify-center min-h-screen">
  <LoadingSpinner size="lg" />
</div>
```

---

## Toast Notifications

```tsx
const { success, error, info } = useToast();

// Success
success("Item created successfully");

// Error
error("Failed to save changes");

// Info
info("Your session will expire soon");
```

---

## Modal/Dialog

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
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Grid Layouts

```tsx
// Responsive grid (1 col mobile, 2 tablet, 4 desktop)
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
  {/* Items */}
</div>

// Two-column form layout
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  {/* Form fields */}
</div>

// Full width item in grid
<div className="md:col-span-2">
  {/* Full width content */}
</div>
```

---

## Colors

```tsx
// Background colors
bg-background
bg-card
bg-muted
bg-primary
bg-success
bg-warning
bg-destructive

// Text colors
text-foreground
text-muted-foreground
text-primary
text-success
text-warning
text-destructive

// Border colors
border-border
border-input
border-primary
```

---

## Spacing

```tsx
// Padding
p-4     // 16px all sides
p-6     // 24px all sides
px-4    // 16px horizontal
py-8    // 32px vertical

// Margin
m-4     // 16px all sides
mb-6    // 24px bottom
mt-1    // 4px top

// Gap (flex/grid)
gap-4   // 16px gap
gap-6   // 24px gap

// Space between (flex column)
space-y-4  // 16px between items
space-y-6  // 24px between items
```

---

## Typography

```tsx
// Page title
<h1 className="text-2xl font-semibold tracking-tight text-foreground">
  Page Title
</h1>

// Card title
<CardTitle className="text-lg font-semibold">Card Title</CardTitle>

// Body text
<p className="text-sm text-foreground">Body text</p>

// Secondary text
<p className="text-sm text-muted-foreground">Secondary info</p>

// Label
<label className="text-xs text-muted-foreground">Label</label>
```

---

## Responsive Patterns

```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="block md:hidden">Mobile only</div>

// Different layouts
<div className="flex flex-col md:flex-row">
  {/* Stack on mobile, row on desktop */}
</div>

// Responsive text size
<h1 className="text-xl md:text-2xl lg:text-3xl">
  Responsive heading
</h1>
```

---

## Status Badge Mapping

```tsx
function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "active":
    case "approved":
    case "sold":
      return "success";
    case "pending":
    case "onboarding":
      return "warning";
    case "rejected":
    case "terminated":
    case "cancelled":
      return "destructive";
    case "info":
      return "info";
    default:
      return "default";
  }
}

<Badge variant={getStatusBadgeVariant(status)}>
  {status}
</Badge>
```

---

## API Error Handling

```tsx
const { error: showError, success: showSuccess } = useToast();

try {
  const res = await fetch("/api/endpoint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json().catch(() => ({}));

  if (!res.ok) {
    showError(result.error || "Operation failed");
    return;
  }

  showSuccess("Operation successful");
  router.push("/success");
} catch (err) {
  console.error(err);
  showError("Network error");
}
```

---

## Form Validation

```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

function validate(): boolean {
  const next: Record<string, string> = {};

  if (!email) next.email = "Email is required";
  if (!name) next.name = "Name is required";
  if (email && !email.includes("@")) next.email = "Invalid email";

  setErrors(next);
  return Object.keys(next).length === 0;
}

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!validate() || loading) return;

  setLoading(true);
  setErrors({});

  try {
    // Submit logic
  } finally {
    setLoading(false);
  }
}
```

---

## Common Icons (lucide-react)

```tsx
import {
  Plus,          // Add/Create
  Edit,          // Edit
  Trash2,        // Delete
  X,             // Close
  Check,         // Confirm
  AlertCircle,   // Warning/Error
  Info,          // Information
  ChevronDown,   // Dropdown
  Search,        // Search
  Filter,        // Filters
  MoreVertical,  // Menu (3 dots)
  FileText,      // Document
  Users,         // People/Team
  Building,      // Office
  Calendar,      // Date
  DollarSign,    // Money/Commission
  TrendingUp,    // Growth/Performance
} from "lucide-react";
```

---

## DO's ✅

- Use semantic color tokens (`bg-card`, `text-foreground`)
- Use spacing scale (`space-y-4`, `gap-6`)
- Include `aria-label` for icon-only buttons
- Show loading states for async operations
- Display errors inline with form fields
- Use EmptyState for empty data lists
- Test at all breakpoints

## DON'Ts ❌

- Don't use hardcoded hex colors
- Don't mix spacing scales arbitrarily
- Don't use alerts for errors (use toast)
- Don't show blank states without feedback
- Don't use `w-full` on buttons unless necessary
- Don't use color as the only indicator
- Don't forget focus states

---

**For full documentation, see:** `docs/design-system.md`
