export const verifyEmailTemplate = (link: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">Bienvenido a Conecta</h2>
  <p style="color: #475569; font-size: 16px;">Hola,</p>
  <p style="color: #475569; font-size: 16px;">Gracias por registrarte. Para completar tu cuenta y acceder a la plataforma, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Verificar mi correo</a>
  </div>
  <p style="color: #475569; font-size: 14px;">Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
</div>
`;

export const inviteNewUserTemplate = (link: string, role: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">Has sido invitado a Conecta</h2>
  <p style="color: #475569; font-size: 16px;">Hola,</p>
  <p style="color: #475569; font-size: 16px;">Se te ha invitado a unirte a Conecta como <strong>${role === "company" ? "Empresa" : "Candidato"}</strong>.</p>
  <p style="color: #475569; font-size: 16px;">Para aceptar la invitación y crear tu cuenta, haz clic en el siguiente botón:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Unirme a Conecta</a>
  </div>
  <p style="color: #475569; font-size: 14px;">El enlace expirará en 7 días.</p>
</div>
`;

export const inviteExistingUserTemplate = (
  link: string,
  dashboardUrl: string
) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">Nueva invitación en Conecta</h2>
  <p style="color: #475569; font-size: 16px;">Hola,</p>
  <p style="color: #475569; font-size: 16px;">Te han invitado a una nueva posición en Conecta. Como ya tienes una cuenta, puedes acceder directamente para ver los detalles.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${dashboardUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Ir a mi Dashboard</a>
  </div>
</div>
`;

export const resetPasswordTemplate = (link: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">Restablecer Contraseña</h2>
  <p style="color: #475569; font-size: 16px;">Recibimos una solicitud para restablecer tu contraseña en Conecta.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" style="background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Restablecer Contraseña</a>
  </div>
  <p style="color: #64748b; font-size: 14px;">Si no solicitaste esto, ignora este correo. Tu contraseña permanecerá segura.</p>
</div>
`;

export const interviewCompletedTemplate = (
  candidateName: string,
  date: string
) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">Entrevista Completada</h2>
  <p style="color: #475569; font-size: 16px;">La entrevista con <strong>${candidateName}</strong> ha sido completada exitosamente.</p>
  <p style="color: #475569; font-size: 16px;">Fecha: ${date}</p>
  <p style="color: #475569; font-size: 16px;">Puedes revisar los resultados y la transcripción en tu panel de control.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://conecta-app.com/company-dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Ver Resultados</a>
  </div>
</div>
`;

export const inviteAcceptedTemplate = (
  candidateEmail: string,
  jobTitle: string,
  companyName: string
) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; text-align: center;">¡Invitación Aceptada!</h2>
  <p style="color: #475569; font-size: 16px;">Hola,</p>
  <p style="color: #475569; font-size: 16px;">El candidato <strong>${candidateEmail}</strong> ha aceptado tu invitación para la posición de <strong>${jobTitle}</strong> en <strong>${companyName}</strong>.</p>
  <p style="color: #475569; font-size: 16px;">El candidato ha sido añadido a tu lista de aplicaciones y está listo para continuar con el proceso de selección.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/company-dashboard" style="background-color: #0f172a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Ver Candidato</a>
  </div>
</div>
`;
