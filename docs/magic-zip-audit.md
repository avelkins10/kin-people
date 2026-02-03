# Magic Patterns Zip – What’s Applied in Kin

Reference: `/Users/austinelkins/Downloads/51a7be92-0c14-4f4e-ab58-8c1eabda68cf/src/`

## Applied (content from zip used in Kin)

| Zip path | Kin location | Notes |
|----------|--------------|--------|
| **components/AppShell.tsx** | `components/AppShell.tsx` | Framer Motion removed (Tailwind only). |
| **components/Sidebar.tsx** | `components/Sidebar.tsx` | + `Link` for logo, `<a>` for logout. |
| **components/ui/Button.tsx** | `components/ui/button.tsx` | + `asChild`, `variant: ghost/default`, `size` for rest of app. |
| **components/ui/Modal.tsx** | `components/ui/Modal.tsx` | Import from `@/components/ui/button`. |
| **components/MetricCard.tsx** | `components/MetricCard.tsx` | Icon type `BoxIcon` → `React.ElementType`. |
| **components/CandidateCard.tsx** | `components/CandidateCard.tsx` | As-is. |
| **components/DealsTable.tsx** | `components/DealsTable.tsx` | As-is. |
| **components/HiringVelocitySparkline.tsx** | `components/HiringVelocitySparkline.tsx` | As-is. |
| **components/RecruiterActivityFeed.tsx** | `components/RecruiterActivityFeed.tsx` | + `!bg-[#0a0a0a]` for dark block. |
| **components/NeedsActionAlert.tsx** | `components/NeedsActionAlert.tsx` | As-is. |
| **components/OpenRolesTable.tsx** | `components/OpenRolesTable.tsx` | As-is. |
| **components/RecruiterLeaderboard.tsx** | `components/RecruiterLeaderboard.tsx` | As-is. |
| **components/RevenueChart.tsx** | `components/RevenueChart.tsx` | As-is. |
| **components/SourceBreakdownChart.tsx** | `components/SourceBreakdownChart.tsx` | As-is. |
| **components/PipelineBoard.tsx** | `components/PipelineBoard.tsx` | As-is. |
| **components/PipelineColumn.tsx** | `components/PipelineColumn.tsx` | Icon type `BoxIcon` → `React.ElementType`. |
| **components/PipelineFilters.tsx** | `components/PipelineFilters.tsx` | As-is. |
| **components/PipelineListView.tsx** | `components/PipelineListView.tsx` | As-is. |
| **components/PipelineMetrics.tsx** | `components/PipelineMetrics.tsx` | + `!bg-[#0a0a0a]` for Metric. |
| **components/modals/AddRecruitModal.tsx** | `components/modals/AddRecruitModal.tsx` | Imports `@/components/ui/...`. |
| **components/modals/NewDealModal.tsx** | `components/modals/NewDealModal.tsx` | Imports `@/components/ui/...`. |
| **pages/OverviewPage.tsx** | `components/pages/OverviewPage.tsx` | `useModals` from `ModalsContext`. |
| **pages/Dashboard.tsx** | `components/pages/Dashboard.tsx` | Same. |
| **pages/PeoplePage.tsx** | `components/pages/PeoplePage.tsx` | Same. |
| **pages/DealsPage.tsx** | `components/pages/DealsPage.tsx` | Same. |
| **pages/CommissionsPage.tsx** | `components/pages/CommissionsPage.tsx` | Same. |
| **pages/OrgChartPage.tsx** | `components/pages/OrgChartPage.tsx` | Same. |
| **pages/SettingsPage.tsx** | `components/pages/SettingsPage.tsx` | Same. |
| **pages/OnboardingPage.tsx** | `components/pages/OnboardingPage.tsx` | Same. |
| **App.tsx** | `components/App.tsx` | Same structure: shell + modals + page switch; layout passes activePage/onNavigate + modal state. |
| **index.css** | `app/globals.css` + `[data-ui="magic"]` | Magic only had Tailwind @import; Kin uses globals + dashboard reset. |

## Not applicable in Next.js

| Zip path | In Kin | Notes |
|----------|--------|--------|
| **index.tsx** | N/A | Vite entry; Next.js uses `app/layout.tsx` + `app/page.tsx` + route layouts. |

## Summary

- **App.tsx** – Applied as `components/App.tsx`; dashboard layout uses `<App ...>{children}</App>`.
- **All components** (ui, modals, shared) – Applied in Kin with minimal path/type/Next.js adaptations.
- **All pages** – Applied under `components/pages/` and used by `/dashboard/*` routes.
- **index.css** – Equivalent: Tailwind in `app/globals.css`; dashboard look via `[data-ui="magic"]`.
- **index.tsx** – N/A (framework entry).
