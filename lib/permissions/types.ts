/**
 * Permission types and definitions for role-based access control.
 */

export enum Permission {
  // System management
  MANAGE_SETTINGS = "MANAGE_SETTINGS",
  MANAGE_ALL_OFFICES = "MANAGE_ALL_OFFICES",
  
  // Regional/Office management
  MANAGE_OWN_REGION = "MANAGE_OWN_REGION",
  MANAGE_OWN_OFFICE = "MANAGE_OWN_OFFICE",
  MANAGE_OWN_TEAM = "MANAGE_OWN_TEAM",
  
  // View permissions
  VIEW_ALL_PEOPLE = "VIEW_ALL_PEOPLE",
  VIEW_OWN_OFFICE_PEOPLE = "VIEW_OWN_OFFICE_PEOPLE",
  VIEW_OWN_TEAM = "VIEW_OWN_TEAM",
  
  // Actions
  CREATE_RECRUITS = "CREATE_RECRUITS",
  CREATE_DEALS = "CREATE_DEALS",
  EDIT_DEALS = "EDIT_DEALS",
  DELETE_DEALS = "DELETE_DEALS",
  APPROVE_COMMISSIONS = "APPROVE_COMMISSIONS",
  RUN_PAYROLL = "RUN_PAYROLL",
  
  // Restricted access
  VIEW_OWN_DATA_ONLY = "VIEW_OWN_DATA_ONLY",
}

export type RolePermissions = {
  [roleName: string]: Permission[];
};
