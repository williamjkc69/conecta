/**
 * Internal status values used for conditions and database records
 */

export const CANDIDATE_STATUS = {
  APPLIED: "applied",
  INVITED: "invited",
  INTERVIEWING: "interviewing",
  COMPLETED: "completed",
  APPROVED: "approved",
  REJECTED: "rejected",
  PENDING: "pending",
  REVIEWED: "reviewed",
  HIRED: "hired",
  EXPIRED: "expired"
} as const;

/**
 * Database Status IDs for Application Statuses
 */
export const CANDIDATE_STATUS_IDS = {
  COMPLETED: 2,
  INTERVIEWING: 6,
  INVITED: 1, // Assumptions based on common patterns, but 2 and 6 are confirmed
  EXPIRED: 7,
  REJECTED: 3,
  APPROVED: 4,
  PENDING: 5
} as const;

export const JOB_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive"
} as const;

export const INTERVIEW_STATUS = {
  INVITED: "invited",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FAILED: "failed",
  REGISTERED: "registered",
  ONGOING: "ongoing",
  PENDING: "pending",
  EXPIRED: "expired"
} as const;

/**
 * Retell SDK specific states
 */
export const RETELL_CALL_STATUS = {
  REGISTERED: "registered",
  NOT_CONNECTED: "not_connected",
  ONGOING: "ongoing",
  ENDED: "ended",
  ERROR: "error"
} as const;

export type CandidateStatus =
  (typeof CANDIDATE_STATUS)[keyof typeof CANDIDATE_STATUS];
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];
export type InterviewStatus =
  (typeof INTERVIEW_STATUS)[keyof typeof INTERVIEW_STATUS];
export type RetellCallStatus =
  (typeof RETELL_CALL_STATUS)[keyof typeof RETELL_CALL_STATUS];
