import nodemailer from "nodemailer";

function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#18181b;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#27272a;border-radius:8px;padding:40px 36px;">
          <tr>
            <td>
              <p style="margin:0 0 28px;font-size:28px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:-0.3px;">Worktasks</p>
              <p style="margin:0 0 24px;font-size:20px;font-weight:600;color:#ffffff;">${title}</p>
              ${body}
              <p style="margin:32px 0 0;font-size:12px;color:#a1a1aa;">
                Worktasks &mdash; <a href="https://worktasks.net" style="color:#a1a1aa;">worktasks.net</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#ffffff;color:#18181b;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">${label}</a>`;
}

function emailText(text: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;color:#d4d4d8;line-height:1.6;">${text}</p>`;
}

function emailSmall(text: string): string {
  return `<p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">${text}</p>`;
}

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
    subject: "Verify your email – Worktasks",
    text: `Verify your email address\n\nClick the link below to confirm your account:\n\n${verifyUrl}\n\nIf you did not create a Worktasks account, you can ignore this email.`,
    html: emailLayout(
      "Verify your email address",
      emailText("Thanks for signing up! Click the button below to confirm your email address and activate your account.") +
      emailButton("Verify email address", verifyUrl) +
      emailSmall(`Or copy this link into your browser:<br/><a href="${verifyUrl}" style="color:#a1a1aa;word-break:break-all;">${verifyUrl}</a>`) +
      emailSmall("If you did not create a Worktasks account, you can safely ignore this email.")
    ),
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
    subject: "Reset your password – Worktasks",
    text: `Reset your password\n\nClick the link below to choose a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request a password reset, ignore this email.`,
    html: emailLayout(
      "Reset your password",
      emailText("We received a request to reset your Worktasks password. Click the button below to choose a new one.") +
      emailButton("Reset password", resetUrl) +
      emailSmall(`Or copy this link into your browser:<br/><a href="${resetUrl}" style="color:#a1a1aa;word-break:break-all;">${resetUrl}</a>`) +
      emailSmall("This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.")
    ),
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
    subject: `You've been invited to join "${workspaceName}" on Worktasks`,
    text: `You've been invited to join "${workspaceName}" on Worktasks.\n\nClick the link below to accept the invitation:\n\n${inviteUrl}\n\nThis invitation expires in 7 days. If you were not expecting this, you can ignore this email.`,
    html: emailLayout(
      `You've been invited to join a workspace`,
      emailText(`You have been invited to join <strong style="color:#ffffff;">${workspaceName}</strong> on Worktasks.`) +
      emailButton("Accept invitation", inviteUrl) +
      emailSmall(`Or copy this link into your browser:<br/><a href="${inviteUrl}" style="color:#a1a1aa;word-break:break-all;">${inviteUrl}</a>`) +
      emailSmall("This invitation expires in 7 days. If you were not expecting this invite, you can safely ignore this email.")
    ),
  });
}
