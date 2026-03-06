// ─────────────────────────────────────────────────────────────────────────────
// rolesConfig.ts  — 4-role permission matrix
//
// Sidebar visibility per role:
//   superAdmin     → Dashboard · Campaigns · Screens · Contents · Playlists · Layouts · Accounts · Player
//   admin          → Dashboard · Screens · Playlists · Accounts (Manage Locations only)
//   contentManager → Dashboard · Contents · Playlists · Layouts
//   viewer         → Dashboard only
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "superAdmin" | "admin" | "contentManager" | "viewer";

export type Permission = {
  canViewCampaigns:       boolean;
  canCreateCampaign:      boolean;
  canEditCampaign:        boolean;
  canDeleteCampaign:      boolean;
  canOverrideSchedules:   boolean;
  canEmergencyBroadcast:  boolean;

  canViewScreens:             boolean;
  canCreateScreen:            boolean;
  canEditScreen:              boolean;
  canDeleteScreen:            boolean;
  canDeactivateScreen:        boolean;
  canPairScreen:              boolean;
  canAssignPlaylistToScreen:  boolean;

  canViewContents:            boolean;
  canUploadContent:           boolean;
  canEditOwnContent:          boolean;
  canEditAnyContent:          boolean;
  canDeleteOwnContent:        boolean;
  canApproveContent:          boolean;
  canArchiveAnyContent:       boolean;
  canHardDeleteContent:       boolean;

  canViewPlaylists:   boolean;
  canCreatePlaylist:  boolean;
  canEditPlaylist:    boolean;
  canDeletePlaylist:  boolean;
  canAssignContent:   boolean;
  canEditContent: boolean;
  canDeleteContent: boolean;

  canViewLayouts:   boolean;
  canCreateLayout:  boolean;
  canEditLayout:    boolean;
  canDeleteLayout:  boolean;

  canViewAccounts:              boolean;
  canViewManageUsers:           boolean;
  canViewManageOrganizations:   boolean;
  canViewManageLocations:       boolean;
  canManageUsers:               boolean;
  canManageOrganizations:       boolean;
  canManageLocations:           boolean;
  canAssignRoles:               boolean;

  canPreviewPlaylist:       boolean;
  canTestPlayback:          boolean;
  canViewReports:           boolean;
  canViewLogs:              boolean;
  canModifySystemSettings:  boolean;
  canViewPlayer:            boolean;
};

export const ROLE_LABELS: Record<Role, string> = {
  superAdmin:     "Super Admin",
  admin:          "Admin",
  contentManager: "Content Manager",
  viewer:         "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  superAdmin:
    "Full unrestricted access to all system features including user management, organization settings, system configuration, and emergency broadcasting.",
  admin:
    "Location Admin: manages screens, pairs displays, assigns playlists to screens, and manages locations. Cannot modify system-wide settings.",
  contentManager:
    "Creates and edits media content, builds playlists and layouts. Cannot pair screens, manage users, or access campaigns.",
  viewer:
    "Read-only auditor access. Can monitor system status and view reports and logs. No modification privileges.",
};

export const ROLE_PERMISSIONS: Record<Role, Permission> = {

  // ── Super Admin — full access ─────────────────────────────────────────────
  superAdmin: {
    canViewCampaigns:      true,
    canCreateCampaign:     true,
    canEditCampaign:       true,
    canDeleteCampaign:     true,
    canOverrideSchedules:  true,
    canEmergencyBroadcast: true,
    canViewScreens:            true,
    canCreateScreen:           true,
    canEditScreen:             true,
    canDeleteScreen:           true,
    canDeactivateScreen:       true,
    canPairScreen:             true,
    canAssignPlaylistToScreen: true,
    canViewContents:      true,
    canUploadContent:     true,
    canEditOwnContent:    true,
    canEditAnyContent:    true,
    canDeleteOwnContent:  true,
    canApproveContent:    true,
    canArchiveAnyContent: true,
    canHardDeleteContent: true,
    canViewPlaylists:  true,
    canCreatePlaylist: true,
    canEditPlaylist:   true,
    canDeletePlaylist: true,
    canAssignContent:  true,
    canEditContent: true,
    canDeleteContent: true,
    canViewLayouts:  true,
    canCreateLayout: true,
    canEditLayout:   true,
    canDeleteLayout: true,
    canViewAccounts:            true,
    canViewManageUsers:         true,
    canViewManageOrganizations: true,
    canViewManageLocations:     true,
    canManageUsers:             true,
    canManageOrganizations:     true,
    canManageLocations:         true,
    canAssignRoles:             true,
    canPreviewPlaylist:      true,
    canTestPlayback:         true,
    canViewReports:          true,
    canViewLogs:             true,
    canModifySystemSettings: true,
    canViewPlayer:           true,
  },

  // ── Admin (Location Admin) ────────────────────────────────────────────────
  // Sidebar: Dashboard · Screens · Playlists · Accounts (Manage Locations only)
  admin: {
    canViewCampaigns:      true,
    canCreateCampaign:     true,
    canEditCampaign:       true,
    canDeleteCampaign:     true,
    canOverrideSchedules:  false,
    canEmergencyBroadcast: false,
    canViewScreens:            true,
    canCreateScreen:           true,
    canEditScreen:             true,
    canDeleteScreen:           false,
    canDeactivateScreen:       false,
    canPairScreen:             true,
    canAssignPlaylistToScreen: true,
    canViewContents:      true,
    canUploadContent:     true,
    canEditOwnContent:    true,
    canEditAnyContent:    false,
    canDeleteOwnContent:  false,
    canApproveContent:    true,
    canArchiveAnyContent: true,
    canHardDeleteContent: false,
    // Playlists — view + assign to screens only (role doc: "Assign playlists and schedules")
    canViewPlaylists:  true,
    canCreatePlaylist: false,  // admin cannot create new playlists
    canEditPlaylist:   true,   // admin CAN edit contents/entries within a playlist
    canDeletePlaylist: false,  // admin cannot delete playlists
    canAssignContent:  true,   // admin CAN assign media to slots
    canEditContent: false,
    canDeleteContent: false,
    canViewLayouts:  true,
    canCreateLayout: false,
    canEditLayout:   false,
    canDeleteLayout: false,
    canViewAccounts:            true,
    canViewManageUsers:         true,
    canViewManageOrganizations: false,
    canViewManageLocations:     true,
    canManageUsers:             false,
    canManageOrganizations:     false,
    canManageLocations:         true,
    canAssignRoles:             false,
    canPreviewPlaylist:      true,
    canTestPlayback:         true,
    canViewReports:          true,
    canViewLogs:             true,
    canModifySystemSettings: false,
    canViewPlayer:           true,
  },

  // ── Content Manager / Editor ──────────────────────────────────────────────
  // Sidebar: Dashboard · Contents · Playlists · Layouts
  contentManager: {
    canViewCampaigns:      false,
    canCreateCampaign:     false,
    canEditCampaign:       false,
    canDeleteCampaign:     false,
    canOverrideSchedules:  false,
    canEmergencyBroadcast: false,
    canViewScreens:            false,
    canCreateScreen:           false,
    canEditScreen:             false,
    canDeleteScreen:           false,
    canDeactivateScreen:       false,
    canPairScreen:             false,
    canAssignPlaylistToScreen: false,
    canViewContents:      true,
    canUploadContent:     true,
    canEditOwnContent:    true,
    canEditAnyContent:    false,
    canDeleteOwnContent:  true,
    canApproveContent:    false,
    canArchiveAnyContent: false,
    canHardDeleteContent: false,
    canViewPlaylists: true,
    canCreatePlaylist: true,
    canEditPlaylist:   true,
    canDeletePlaylist: false,
    canAssignContent:  true,
    canEditContent: true,
    canDeleteContent: true,
    canViewLayouts:  true,
    canCreateLayout: true,
    canEditLayout:   true,
    canDeleteLayout: false,
    canViewAccounts:            false,
    canViewManageUsers:         false,
    canViewManageOrganizations: false,
    canViewManageLocations:     false,
    canManageUsers:             false,
    canManageOrganizations:     false,
    canManageLocations:         false,
    canAssignRoles:             false,
    canPreviewPlaylist:      true,
    canTestPlayback:         true,
    canViewReports:          false,
    canViewLogs:             false,
    canModifySystemSettings: false,
    canViewPlayer:           false,
  },

  // ── Viewer / Auditor ──────────────────────────────────────────────────────
  // Sidebar: Dashboard only
  viewer: {
    canViewCampaigns:      true,
    canCreateCampaign:     false,
    canEditCampaign:       false,
    canDeleteCampaign:     false,
    canOverrideSchedules:  false,
    canEmergencyBroadcast: false,
    canViewScreens:            true,
    canCreateScreen:           false,
    canEditScreen:             false,
    canDeleteScreen:           false,
    canDeactivateScreen:       false,
    canPairScreen:             false,
    canAssignPlaylistToScreen: false,
    canViewContents:      true,
    canUploadContent:     false,
    canEditOwnContent:    false,
    canEditAnyContent:    false,
    canDeleteOwnContent:  false,
    canApproveContent:    false,
    canArchiveAnyContent: false,
    canHardDeleteContent: false,
    canViewPlaylists:  true,
    canCreatePlaylist: false,
    canEditPlaylist:   false,
    canDeletePlaylist: false,
    canAssignContent:  false,
    canEditContent: false,
    canDeleteContent: false,
    canViewLayouts:  true,
    canCreateLayout: false,
    canEditLayout:   false,
    canDeleteLayout: false,
    canViewAccounts:            false,
    canViewManageUsers:         false,
    canViewManageOrganizations: false,
    canViewManageLocations:     false,
    canManageUsers:             false,
    canManageOrganizations:     false,
    canManageLocations:         false,
    canAssignRoles:             false,
    canPreviewPlaylist:      false,
    canTestPlayback:         false,
    canViewReports:          true,
    canViewLogs:             true,
    canModifySystemSettings: false,
    canViewPlayer:           false,
  },
};


export function getPermissions(role: Role): Permission {
  return ROLE_PERMISSIONS[role];
};


