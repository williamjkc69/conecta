export const ROUTES = {
  HOME: "/",
  LOGIN: "/?login=true",
  REGISTER: "/register", // if exists
  VERIFY_EMAIL: "/verify-email",
  COMPANY_DASHBOARD: "/company-dashboard",
  CANDIDATE_DASHBOARD: "/candidate-dashboard",
  FORGOT_PASSWORD: "/forgot-password",
  UPDATE_PASSWORD: "/update-password"
} as const;

export const API_ROUTES = {
  // Routes moved to Server Actions:
  // SEND_EMAIL: "/api/send-email",
  // CHECK_USER: "/api/check-user",
  // ACCEPT_INVITE: "/api/accept-invite"
} as const;
