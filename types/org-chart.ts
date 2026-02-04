/**
 * TypeScript types for org chart functionality.
 */

export type RelationshipType = 'reports_to' | 'recruited_by';

export type ViewMode = 'tree' | 'list';

export type PersonStatus = 'active' | 'onboarding' | 'inactive' | 'terminated';

export type RoleLevelFilter = 'all' | '1' | '2' | '3+';

export interface PersonData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string | null;
  roleLevel: number | null;
  officeId: string | null;
  officeName: string | null;
  reportsToId: string | null;
  recruitedById: string | null;
  status: PersonStatus | null;
  profileImageUrl: string | null;
  directReportCount: number;
}

export interface OrgTreeNode {
  person: PersonData;
  children: OrgTreeNode[];
  isLastChild?: boolean;
}

export interface OrgChartFilters {
  status: PersonStatus[];
  roleLevel: RoleLevelFilter;
  office: string | null;
  search: string;
  focusPersonId: string | null;
}
