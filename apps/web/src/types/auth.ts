/**
 * Authentication and authorization types
 */

/**
 * Project member roles following RBAC pattern
 * Per rule 80_security_and_abuse_prevention.md
 */
export enum ProjectRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

/**
 * Project member with role
 */
export interface ProjectMember {
  projectId: string
  userId: string
  role: ProjectRole
  addedAt: Date
}

/**
 * Share token for read-only access
 * Must have >= 128-bit entropy
 */
export interface ShareToken {
  token: string
  projectId: string
  createdBy: string
  createdAt: Date
  expiresAt: Date | null
  revoked: boolean
}
