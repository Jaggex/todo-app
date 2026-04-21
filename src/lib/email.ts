import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV === "development";

const smtpHost = isDev ? process.env.DEV_SMTP_HOST : process.env.SMTP_HOST;
const smtpPort = Number(
  (isDev ? process.env.DEV_SMTP_PORT : process.env.SMTP_PORT) ?? "587"
);
const smtpUser = isDev ? process.env.DEV_SMTP_USER : process.env.SMTP_USER;
const smtpPass = isDev ? process.env.DEV_SMTP_PASS : process.env.SMTP_PASS;
const emailFrom =
  (isDev ? process.env.DEV_EMAIL_FROM : process.env.EMAIL_FROM) ?? smtpUser;

let transporter: nodemailer.Transporter | undefined;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error(
        "Missing SMTP configuration. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local"
      );
    }

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return transporter;
}

function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  next?: string
): Promise<void> {
  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}${next ? `&next=${encodeURIComponent(next)}` : ``}`;

  await getTransporter().sendMail({
    from: emailFrom,
    to,
    subject: "Verify your email",
    text: `Click this link to verify your email:\n\n${verifyUrl}\n\nIf you did not create an account, ignore this email.`,
    html: `
      <p>Click the link below to verify your email:</p>
      <p><a href="${verifyUrl}">Verify email</a></p>
      <p>If you did not create an account, ignore this email.</p>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await getTransporter().sendMail({
    from: emailFrom,
    to,
    subject: "Reset your password",
    text: `Click this link to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request a password reset, ignore this email.`,
    html: `
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>This link expires in 1 hour. If you did not request a password reset, ignore this email.</p>
    `,
  });
}

export async function sendWorkspaceInviteEmail(
  to: string,
  workspaceName: string,
  inviteUrl: string
): Promise<void> {
  await getTransporter().sendMail({
    from: emailFrom,
    to,
    subject: `You've been invited to "${workspaceName}" on Worktasks`,
    text: `You have been invited to join the workspace "${workspaceName}" on Worktasks.\n\nClick the link below to accept the invitation:\n\n${inviteUrl}\n\nThis invitation expires in 7 days. If you were not expecting this, you can ignore this email.`,
    html: `
      <p>You have been invited to join the workspace <strong>${workspaceName}</strong> on Worktasks.</p>
      <p><a href="${inviteUrl}">Accept invitation</a></p>
      <p>This invitation expires in 7 days. If you were not expecting this, you can ignore this email.</p>
    `,
  });
}
