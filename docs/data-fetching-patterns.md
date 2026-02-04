# Data Fetching Patterns

This document describes the data fetching architecture and patterns used in the Kin People App.

## Overview

The application uses **TanStack Query (React Query)** for server state management, providing:
- **Automatic caching** - Data is cached for 30 seconds by default
- **Request deduplication** - Multiple components requesting the same data trigger only one API call
- **Background refetching** - Stale data is automatically refreshed
- **Optimistic updates** - UI updates immediately, syncs with server in background

## Architecture

### Provider Setup

React Query is configured in `components/providers.tsx`:

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // Data fresh for 30 seconds
      gcTime: 5 * 60 * 1000,       // Cache kept for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1,                    // Retry failed requests once
      retryDelay: 1000,           // 1 second between retries
    },
  },
})
```

### Custom Hooks Location

All React Query hooks are organized in the `/hooks` directory:

```
/hooks
  /use-dashboard-data.ts     # Dashboard stats, onboarding, recruiting stats
  /use-people-data.ts        # People, person details, offices, roles
  /use-deals-data.ts         # Deals data
  /use-commissions-data.ts   # Commission data
  /use-recruiting-data.ts    # Recruits and recruiting stats
```

## Patterns

### 1. Creating a New Hook

**Template:**
```typescript
// hooks/use-example-data.ts
import { useQuery } from "@tanstack/react-query";

export interface ExampleItem {
  id: string;
  name: string;
  // ... other fields
}

export function useExampleItems(filters?: { status?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append("status", filters.status);

  return useQuery({
    queryKey: ["example-items", filters],  // Unique key for this query
    queryFn: async () => {
      const response = await fetch(`/api/example?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch example items");
      }
      return response.json() as Promise<ExampleItem[]>;
    },
  });
}
```

**Key points:**
- Export TypeScript interfaces for type safety
- Use `queryKey` array with filters to enable per-filter caching
- Always check `response.ok` and throw errors for proper error handling
- Return the full `useQuery` result (includes `data`, `isLoading`, `error`, etc.)

### 2. Using Hooks in Components

**Example: List View**
```typescript
"use client";

import { useExampleItems } from "@/hooks/use-example-data";

export function ExampleList() {
  const { data: items = [], isLoading, error } = useExampleItems({ status: "active" });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

**Example: Detail View with Multiple Queries**
```typescript
export function ExampleDetail({ id }: { id: string }) {
  // These run in parallel and cache independently
  const { data: item, isLoading: itemLoading } = useExampleItem(id);
  const { data: related, isLoading: relatedLoading } = useRelatedItems(id);

  if (itemLoading || relatedLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{item?.name}</h1>
      <ul>{related?.map(...)}</ul>
    </div>
  );
}
```

### 3. Query Keys

Query keys are used for caching and invalidation. Use consistent patterns:

```typescript
// Good - hierarchical keys
["people"]                           // All people
["people", personId]                 // Specific person
["people", { officeId: "123" }]     // Filtered people
["deals", { closerId: "456" }]      // Deals by closer

// Bad - inconsistent keys
["allPeople"]                        // Not hierarchical
["person-123"]                       // Harder to invalidate
```

### 4. Handling Loading States

**Parallel queries:**
```typescript
const { data: people, isLoading: peopleLoading } = usePeople();
const { data: offices, isLoading: officesLoading } = useOffices();

const loading = peopleLoading || officesLoading;
```

**Dependent queries:**
```typescript
const { data: person } = usePerson(personId);
const { data: deals } = useDeals({
  closerId: person?.id,
  // Only fetch when person exists
}, { enabled: !!person?.id });
```

### 5. Mutations (Updates)

For creating/updating/deleting data, use `useMutation`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const response = await fetch(`/api/people/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["people", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

// Usage in component
const updatePerson = useUpdatePerson();

async function handleSubmit(formData) {
  try {
    await updatePerson.mutateAsync({ id: "123", name: "New Name" });
    toast.success("Updated!");
  } catch (error) {
    toast.error("Failed to update");
  }
}
```

### 6. Manual Refetching

Sometimes you need to manually refetch data:

```typescript
const { data, refetch } = usePeople();

// Trigger manual refetch
useEffect(() => {
  const handler = () => refetch();
  window.addEventListener("people-updated", handler);
  return () => window.removeEventListener("people-updated", handler);
}, [refetch]);
```

### 7. Optimistic Updates

For instant UI feedback:

```typescript
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: updatePerson,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["people", newData.id] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(["people", newData.id]);

    // Optimistically update
    queryClient.setQueryData(["people", newData.id], newData);

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData(["people", variables.id], context.previous);
    }
  },
  onSettled: (data, error, variables) => {
    // Always refetch after mutation
    queryClient.invalidateQueries({ queryKey: ["people", variables.id] });
  },
});
```

## Common Patterns in This App

### Dashboard Components

Multiple queries run in parallel:
```typescript
// All run concurrently, cache separately
const { data: stats } = useDashboardStats();
const { data: onboarding } = useOnboardingPeople();
const { data: recruiting } = useRecruitingStats();
```

### Person Detail Page

Tabs use shared cache:
```typescript
// Main page fetches person
const { data: person } = usePerson(id);

// Tabs use same cached queries
<TabsContent value="deals">
  <PersonDeals personId={id} />  {/* Uses useDeals({ closerId: id }) */}
</TabsContent>
<TabsContent value="commissions">
  <PersonCommissions personId={id} />  {/* Uses useCommissions({ personId: id }) */}
</TabsContent>
```

When switching tabs, data is instant if already cached!

### List to Detail Navigation

When navigating from a list to detail page:
1. List fetches all items: `useItems()`
2. Click item to go to detail page
3. Detail page: `useItem(id)`
4. If recently viewed, loads instantly from cache

## Converting Old Code to React Query

### Before (useState + useEffect):
```typescript
const [people, setPeople] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchPeople() {
    setLoading(true);
    try {
      const res = await fetch("/api/people");
      const data = await res.json();
      setPeople(data);
    } finally {
      setLoading(false);
    }
  }
  fetchPeople();
}, []);
```

### After (React Query):
```typescript
const { data: people = [], isLoading: loading } = usePeople();
```

**Benefits:**
- 90% less code
- Automatic caching
- Automatic refetching when stale
- Request deduplication
- Error handling built-in
- Loading states managed automatically

## Best Practices

### ✅ Do:
- Use descriptive query keys: `["people", filters]`
- Handle loading and error states
- Use TypeScript interfaces for type safety
- Invalidate queries after mutations
- Use `enabled` option for dependent queries
- Keep hooks in `/hooks` directory

### ❌ Don't:
- Make direct `fetch()` calls in components
- Use `useState` for server data
- Forget to handle errors
- Use inconsistent query key patterns
- Skip the `queryKey` parameter
- Duplicate data fetching logic

## Performance Tips

1. **Parallel Fetching**: Multiple `useQuery` calls run in parallel automatically
2. **Prefetching**: Use `queryClient.prefetchQuery()` for anticipated data
3. **Stale Time**: Adjust per-query if data changes rarely:
   ```typescript
   useQuery({
     queryKey: ["static-data"],
     queryFn: fetchData,
     staleTime: Infinity,  // Never refetch
   })
   ```
4. **Pagination**: Use `useInfiniteQuery` for infinite scroll
5. **Selective Refetch**: Use query filters in invalidation

## Debugging

### DevTools

Install React Query DevTools (already included in dev):
```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Console Logging

Add logging to see what's cached:
```typescript
const queryClient = useQueryClient();
console.log('Cached people:', queryClient.getQueryData(["people"]));
```

### Network Tab

React Query doesn't prevent you from seeing network requests - they still show in DevTools Network tab. Look for:
- Requests with "(from cache)" in the Size column
- Fewer duplicate requests
- Faster subsequent loads

## Migration Notes

**Completed migrations:**
- ✅ Dashboard/Overview page
- ✅ People list and detail pages
- ✅ Recruiting pipeline
- ✅ Deals list (person deals component)
- ✅ Commissions (person commissions component)

**TODO (future):**
- Settings pages
- Individual deal detail pages
- Commission management pages

## Additional Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query Essentials](https://tanstack.com/query/latest/docs/react/guides/important-defaults)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/react/guides/query-keys)
