// ─────────────────────────────────────────────────────────────────────────────
// rolesConfig.ts
// Single source of truth for roles and permissions across the CMS.
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "superAdmin" | "admin" | "contentManager" | "viewer";

export interface Permission {
  // Navigation visibility
  canViewDashboard: boolean;
  canViewCampaigns: boolean;
  canViewScreens: boolean;
  canViewContents: boolean;
  canViewPlaylists: boolean;
  canViewLayouts: boolean;
  canViewAccounts: boolean;
  canViewManageUsers: boolean;
  canViewManageOrganizations: boolean;
  canViewManageLocations: boolean;
  canViewPlayer: boolean;

  // Campaigns
  canCreateCampaign: boolean;
  canEditCampaign: boolean;
  canDeleteCampaign: boolean;
  canOverrideSchedules: boolean;
  canEmergencyBroadcast: boolean;

  // Screens
  canCreateScreen: boolean;
  canEditScreen: boolean;
  canDeleteScreen: boolean;
  canDeactivateScreen: boolean;
  canPairScreen: boolean;
  canAssignPlaylistToScreen: boolean;

  // Contents
  canUploadContent: boolean;
  canEditContent: boolean;
  canDeleteContent: boolean;

  // Playlists
  canCreatePlaylist: boolean;
  canEditPlaylist: boolean;
  canDeletePlaylist: boolean;
  canAssignContent: boolean; // subject to admin approval for contentManager

  // Layouts
  canCreateLayout: boolean;
  canEditLayout: boolean;
  canDeleteLayout: boolean;

  // Users & Organizations
  canManageUsers: boolean;
  canManageOrganizations: boolean;
  canManageLocations: boolean;
  canAssignRoles: boolean;

  // System
  canViewReports: boolean;
  canViewLogs: boolean;
  canModifySystemSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, Permission> = {
  // ── Super Admin ─────────────────────────────────────────────────────────────
  superAdmin: {
    canViewDashboard: true,
    canViewCampaigns: true,
    canViewScreens: true,
    canViewContents: true,
    canViewPlaylists: true,
    canViewLayouts: true,
    canViewAccounts: true,
    canViewManageUsers: true,
    canViewManageOrganizations: true,
    canViewManageLocations: true,
    canViewPlayer: true,

    canCreateCampaign: true,
    canEditCampaign: true,
    canDeleteCampaign: true,
    canOverrideSchedules: true,
    canEmergencyBroadcast: true,

    canCreateScreen: true,
    canEditScreen: true,
    canDeleteScreen: true,
    canDeactivateScreen: true,
    canPairScreen: true,
    canAssignPlaylistToScreen: true,

    canUploadContent: true,
    canEditContent: true,
    canDeleteContent: true,

    canCreatePlaylist: true,
    canEditPlaylist: true,
    canDeletePlaylist: true,
    canAssignContent: true,

    canCreateLayout: true,
    canEditLayout: true,
    canDeleteLayout: true,

    canManageUsers: true,
    canManageOrganizations: true,
    canManageLocations: true,
    canAssignRoles: true,

    canViewReports: true,
    canViewLogs: true,
    canModifySystemSettings: true,
  },

  // ── Admin (Location Admin) ──────────────────────────────────────────────────
  admin: {
    canViewDashboard: true,
    canViewCampaigns: true,
    canViewScreens: true,
    canViewContents: true,
    canViewPlaylists: true,
    canViewLayouts: true,
    canViewAccounts: false,
    canViewManageUsers: false,
    canViewManageOrganizations: false,
    canViewManageLocations: true,
    canViewPlayer: true,

    canCreateCampaign: true,
    canEditCampaign: true,
    canDeleteCampaign: false,
    canOverrideSchedules: false,
    canEmergencyBroadcast: false,

    canCreateScreen: true,
    canEditScreen: true,
    canDeleteScreen: false,
    canDeactivateScreen: false,
    canPairScreen: true,
    canAssignPlaylistToScreen: true,

    canUploadContent: true,
    canEditContent: true,
    canDeleteContent: false,

    canCreatePlaylist: true,
    canEditPlaylist: true,
    canDeletePlaylist: false,
    canAssignContent: true,

    canCreateLayout: true,
    canEditLayout: true,
    canDeleteLayout: false,

    canManageUsers: false,
    canManageOrganizations: false,
    canManageLocations: true,
    canAssignRoles: false,

    canViewReports: true,
    canViewLogs: true,
    canModifySystemSettings: false,
  },

  // ── Content Manager / Editor ────────────────────────────────────────────────
  contentManager: {
    canViewDashboard: true,
    canViewCampaigns: false,
    canViewScreens: false,
    canViewContents: true,
    canViewPlaylists: true,
    canViewLayouts: true,
    canViewAccounts: false,
    canViewManageUsers: false,
    canViewManageOrganizations: false,
    canViewManageLocations: false,
    canViewPlayer: true,

    canCreateCampaign: false,
    canEditCampaign: false,
    canDeleteCampaign: false,
    canOverrideSchedules: false,
    canEmergencyBroadcast: false,

    canCreateScreen: false,
    canEditScreen: false,
    canDeleteScreen: false,
    canDeactivateScreen: false,
    canPairScreen: false,
    canAssignPlaylistToScreen: false,

    canUploadContent: true,
    canEditContent: true,
    canDeleteContent: false,

    canCreatePlaylist: true,
    canEditPlaylist: true,
    canDeletePlaylist: false,
    canAssignContent: true, // optional admin approval handled in UI

    canCreateLayout: false,
    canEditLayout: true,
    canDeleteLayout: false,

    canManageUsers: false,
    canManageOrganizations: false,
    canManageLocations: false,
    canAssignRoles: false,

    canViewReports: false,
    canViewLogs: false,
    canModifySystemSettings: false,
  },

  // ── Viewer / Auditor ────────────────────────────────────────────────────────
  viewer: {
    canViewDashboard: true,
    canViewCampaigns: true,
    canViewScreens: true,
    canViewContents: true,
    canViewPlaylists: true,
    canViewLayouts: true,
    canViewAccounts: false,
    canViewManageUsers: false,
    canViewManageOrganizations: false,
    canViewManageLocations: false,
    canViewPlayer: true,

    canCreateCampaign: false,
    canEditCampaign: false,
    canDeleteCampaign: false,
    canOverrideSchedules: false,
    canEmergencyBroadcast: false,

    canCreateScreen: false,
    canEditScreen: false,
    canDeleteScreen: false,
    canDeactivateScreen: false,
    canPairScreen: false,
    canAssignPlaylistToScreen: false,

    canUploadContent: false,
    canEditContent: false,
    canDeleteContent: false,

    canCreatePlaylist: false,
    canEditPlaylist: false,
    canDeletePlaylist: false,
    canAssignContent: false,

    canCreateLayout: false,
    canEditLayout: false,
    canDeleteLayout: false,

    canManageUsers: false,
    canManageOrganizations: false,
    canManageLocations: false,
    canAssignRoles: false,

    canViewReports: true,
    canViewLogs: true,
    canModifySystemSettings: false,
  },
};

export const ROLE_LABELS: Record<Role, string> = {
  superAdmin: "Super Admin",
  admin: "Administrator",
  contentManager: "Content Manager / Editor",
  viewer: "Viewer / Auditor",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  superAdmin: "Full system access. Can manage all users, settings, and perform emergency actions.",
  admin: "Location-level admin. Manages screens, playlists, and local deployments.",
  contentManager: "Creates and manages media content, playlists, and basic schedules.",
  viewer: "Read-only access. Can monitor and audit but cannot modify anything.",
};

/** Convenience: get resolved permissions for a given role */
export function getPermissions(role: Role): Permission {
  return ROLE_PERMISSIONS[role];
}

/** Check a single permission for a role */
export function can(role: Role, permission: keyof Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}
