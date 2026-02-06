import type { CurrentUser } from "../get-current-user";

/**
 * Test helper functions for creating mock user objects.
 * 
 * These helpers are used in unit tests for permission logic and authorization checks.
 */

/**
 * Create a mock admin user object.
 */
export function createMockAdmin(): NonNullable<CurrentUser> {
  return {
    id: "admin-id",
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    roleId: "admin-role-id",
    roleName: "Admin",
    roleLevel: 5,
    officeId: null,
    reportsToId: null,
    recruitedById: null,
    status: "active",

  };
}

/**
 * Create a mock team lead user object.
 */
export function createMockTeamLead(): NonNullable<CurrentUser> {
  return {
    id: "teamlead-id",
    firstName: "Team",
    lastName: "Lead",
    email: "teamlead@example.com",
    roleId: "teamlead-role-id",
    roleName: "Team Lead",
    roleLevel: 2,
    officeId: "office-id",
    reportsToId: "manager-id",
    recruitedById: null,
    status: "active",

  };
}

/**
 * Create a mock sales rep user object.
 */
export function createMockSalesRep(): NonNullable<CurrentUser> {
  return {
    id: "salesrep-id",
    firstName: "Sales",
    lastName: "Rep",
    email: "salesrep@example.com",
    roleId: "salesrep-role-id",
    roleName: "Sales Rep",
    roleLevel: 1,
    officeId: "office-id",
    reportsToId: "teamlead-id",
    recruitedById: "teamlead-id",
    status: "active",

  };
}

/**
 * Create a mock regional manager user object.
 */
export function createMockRegionalManager(): NonNullable<CurrentUser> {
  return {
    id: "regional-manager-id",
    firstName: "Regional",
    lastName: "Manager",
    email: "regional@example.com",
    roleId: "regional-role-id",
    roleName: "Regional Manager",
    roleLevel: 4,
    officeId: "office-id",
    reportsToId: null,
    recruitedById: null,
    status: "active",

  };
}

/**
 * Create a mock office manager user object.
 */
export function createMockOfficeManager(): NonNullable<CurrentUser> {
  return {
    id: "office-manager-id",
    firstName: "Office",
    lastName: "Manager",
    email: "office@example.com",
    roleId: "office-role-id",
    roleName: "Area Director",
    roleLevel: 3,
    officeId: "office-id",
    reportsToId: "regional-manager-id",
    recruitedById: null,
    status: "active",

  };
}
