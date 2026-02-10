import { EMAILS } from "@/constants/text";
import { EXTERNAL_LINKS } from "@/constants/assets";
import { ROLES } from "@/constants/roles";

export const verifyEmailTemplate = (link: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">${EMAILS.TEMPLATES.WELCOME_TO_CONECTA}</h2>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.HELLO.replace("{name}", "")}</p>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.THANKS_SIGNUP}</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" target="_blank" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">${EMAILS.TEMPLATES.VERIFY_BUTTON}</a>
  </div>
  <p style="color: #475569; font-size: 14px;">${EMAILS.TEMPLATES.IGNORE_IF_NOT_YOU}</p>
</div>
`;

export const inviteNewUserTemplate = (link: string, role: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">${EMAILS.TEMPLATES.HAS_BEEN_INVITED}</h2>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.HELLO.replace("{name}", "")}</p>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.INVITE_ROLE.replace("{role}", role === ROLES.COMPANY ? "Empresa" : "Candidato")}</p>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.ACCEPT_INVITE}</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" target="_blank" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">${EMAILS.TEMPLATES.JOIN_BUTTON}</a>
  </div>
  <p style="color: #475569; font-size: 14px;">${EMAILS.TEMPLATES.EXPIRATION_NOTICE}</p>
</div>
`;

export const inviteExistingUserTemplate = (
  link: string,
  dashboardUrl: string
) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">${EMAILS.TEMPLATES.NEW_INVITE_CONECTA}</h2>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.HELLO.replace("{name}", "")}</p>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.EXISTING_USER_INVITE}</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${dashboardUrl}" target="_blank" style="background-color: #0f172a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">${EMAILS.TEMPLATES.GO_TO_DASHBOARD}</a>
  </div>
</div>
`;

export const resetPasswordTemplate = (link: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">${EMAILS.TEMPLATES.RESET_PW_TITLE}</h2>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.RESET_PW_DESC}</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" target="_blank" style="background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">${EMAILS.TEMPLATES.RESET_BUTTON}</a>
  </div>
  <p style="color: #64748b; font-size: 14px;">${EMAILS.TEMPLATES.RESET_IGNORE}</p>
</div>
`;

export const interviewCompletedTemplate = (
  candidateName: string,
  date: string
) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">${EMAILS.TEMPLATES.INTERVIEW_COMPLETED_TITLE}</h2>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.INTERVIEW_COMPLETED_DESC.replace("{name}", candidateName)}</p>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.DATE.replace("{date}", date)}</p>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.REVIEW_RESULTS}</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${EXTERNAL_LINKS.COMPANY_DASHBOARD}" target="_blank" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">${EMAILS.TEMPLATES.VIEW_RESULTS_BUTTON}</a>
  </div>
</div>
`;

export const inviteAcceptedTemplate = (
  candidateEmail: string,
  jobTitle: string,
  companyName: string
) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">${EMAILS.TEMPLATES.INVITE_ACCEPTED_TITLE}</h2>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.HELLO.replace("{name}", "")}</p>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.INVITE_ACCEPTED_DESC.replace("{email}", candidateEmail).replace("{jobTitle}", jobTitle).replace("{companyName}", companyName)}</p>
  <p style="color: #475569; font-size: 16px;">${EMAILS.TEMPLATES.READY_TO_CONTINUE}</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${EXTERNAL_LINKS.COMPANY_DASHBOARD}" target="_blank" style="background-color: #0f172a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">${EMAILS.TEMPLATES.VIEW_CANDIDATE_BUTTON}</a>
  </div>
</div>
`;

export const decisionApprovedTemplate = (
  candidateName: string,
  jobTitle: string
) => `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #10b981; text-align: center;">${EMAILS.TEMPLATES.WELCOME_TITLE.replace("{name}", candidateName)}</h2>
  <p>${EMAILS.TEMPLATES.SELECT_SUCCESS.replace("{jobTitle}", jobTitle)}</p>
  <p>${EMAILS.TEMPLATES.HR_CONTACT}</p>
  <p>${EMAILS.TEMPLATES.WELCOME_ABOARD}</p>
  <br/>
  <p>${EMAILS.TEMPLATES.BEST_REGARDS}<br/>${EMAILS.TEMPLATES.TEAM_SIGNATURE}</p>
</div>
`;

export const decisionRejectedTemplate = (
  candidateName: string,
  jobTitle: string
) => `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">${EMAILS.TEMPLATES.UPDATE_TITLE}</h2>
  <p>${EMAILS.TEMPLATES.HELLO.replace("{name}", candidateName)}</p>
  <p>${EMAILS.TEMPLATES.THANKS_PARTICIPATION.replace("{jobTitle}", jobTitle)}</p>
  <p>${EMAILS.TEMPLATES.REJECTION_REASON}</p>
  <p>${EMAILS.TEMPLATES.FUTURE_OPPORTUNITIES}</p>
  <p>${EMAILS.TEMPLATES.GOOD_LUCK}</p>
  <br/>
  <p>${EMAILS.TEMPLATES.BEST_REGARDS}<br/>${EMAILS.TEMPLATES.TEAM_SIGNATURE}</p>
</div>
`;
