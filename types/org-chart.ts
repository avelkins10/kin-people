/**
 * TypeScript types for org chart functionality.
 */

export type RelationshipType = 'reports_to' | 'recruited_by';

export type ViewMode = 'tree' | 'list';

export interface PersonData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string | null;
  officeId: string | null;
  officeName: string | null;
  reportsToId: string | null;
  recruitedById: string | null;
  status: string | null;
  profileImageUrl: string | null;
}

export interface OrgTreeNode {
  person: PersonData;
  children: OrgTreeNode[];
}
