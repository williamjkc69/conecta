/**
 * Common strings and shared constants
 */

export const HTTP_HEADERS = {
  CONTENT_TYPE_JSON: "application/json",
  AUTHORIZATION: "Authorization"
} as const;

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE"
} as const;

export const UI_MODES = {
  CREATE: "create",
  EDIT: "edit",
  VIEW: "view"
} as const;

export const AI_ROLES = {
  AGENT: "agent",
  ASSISTANT: "assistant",
  USER: "user",
  SYSTEM: "system"
} as const;

export type UIMode = (typeof UI_MODES)[keyof typeof UI_MODES];
export type HTTPMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
export type AIRole = (typeof AI_ROLES)[keyof typeof AI_ROLES];
