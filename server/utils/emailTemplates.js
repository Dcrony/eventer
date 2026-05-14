// utils/emailTemplates.js

const BASE_URL = process.env.FRONTEND_URL || "https://tickispot.com";

// ─── Shared Design Tokens ────────────────────────────────────────────────────
const brand = {
  pink: "#ec4899",
  pinkDark: "#db2777",
  pinkLight: "#fdf2f8",
  purple: "#8b5cf6",
  green: "#16a34a",
  greenLight: "#f0fdf4",
  blue: "#2563eb",
  blueLight: "#eff6ff",
  amber: "#d97706",
  amberLight: "#fffbeb",
  dark: "#0f172a",
  gray: "#64748b",
  grayLight: "#f8fafc",
  border: "#e2e8f0",
  white: "#ffffff",
};

// ─── SVG Thumbnail Generators ────────────────────────────────────────────────

const thumbnails = {
  welcome: () => `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ec4899"/>
          <stop offset="50%" style="stop-color:#a855f7"/>
          <stop offset="100%" style="stop-color:#6366f1"/>
        </linearGradient>
        <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.15"/>
          <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#wg)" rx="12"/>
      <!-- Abstract shapes -->
      <circle cx="520" cy="40" r="80" fill="url(#wg2)"/>
      <circle cx="80" cy="170" r="60" fill="url(#wg2)"/>
      <circle cx="300" cy="-20" r="100" fill="#ffffff" fill-opacity="0.05"/>
      <!-- Confetti dots -->
      <circle cx="60" cy="60" r="4" fill="#ffffff" fill-opacity="0.6"/>
      <circle cx="120" cy="30" r="3" fill="#fbbf24" fill-opacity="0.8"/>
      <circle cx="180" cy="80" r="5" fill="#ffffff" fill-opacity="0.4"/>
      <circle cx="450" cy="50" r="3" fill="#fbbf24" fill-opacity="0.8"/>
      <circle cx="500" cy="140" r="4" fill="#ffffff" fill-opacity="0.5"/>
      <circle cx="380" cy="170" r="3" fill="#fbbf24" fill-opacity="0.7"/>
      <circle cx="250" cy="40" r="2" fill="#ffffff" fill-opacity="0.6"/>
      <circle cx="330" cy="160" r="5" fill="#ffffff" fill-opacity="0.3"/>
      <!-- Stars -->
      <text x="140" y="55" font-size="16" fill="#fbbf24" opacity="0.9">✦</text>
      <text x="440" y="160" font-size="12" fill="#ffffff" opacity="0.7">✦</text>
      <text x="340" y="45" font-size="10" fill="#fbbf24" opacity="0.8">✦</text>
      <!-- Logo area -->
      <rect x="220" y="55" width="160" height="44" rx="22" fill="#ffffff" fill-opacity="0.2"/>
      <text x="300" y="84" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">TickiSpot 🎉</text>
      <!-- Subtext -->
      <text x="300" y="135" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" fill-opacity="0.9">Welcome to the platform</text>
      <text x="300" y="158" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" fill-opacity="0.7">Your events journey starts here</text>
    </svg>`,

  otp: () => `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="og" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e40af"/>
          <stop offset="100%" style="stop-color:#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#og)" rx="12"/>
      <!-- Grid pattern -->
      <rect x="0" y="0" width="600" height="200" fill="url(#og)" rx="12"/>
      <line x1="0" y1="40" x2="600" y2="40" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="0" y1="80" x2="600" y2="80" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="0" y1="120" x2="600" y2="120" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="0" y1="160" x2="600" y2="160" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="100" y1="0" x2="100" y2="200" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="200" y1="0" x2="200" y2="200" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="300" y1="0" x2="300" y2="200" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="400" y1="0" x2="400" y2="200" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="500" y1="0" x2="500" y2="200" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <!-- Shield icon -->
      <text x="300" y="90" text-anchor="middle" font-size="42" fill="#ffffff" opacity="0.9">🛡️</text>
      <text x="300" y="135" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">Verification Code</text>
      <text x="300" y="158" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#93c5fd">Expires in 10 minutes · Do not share</text>
    </svg>`,

  passwordReset: () => `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="prg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f172a"/>
          <stop offset="100%" style="stop-color:#1e293b"/>
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#prg)" rx="12"/>
      <!-- Amber glow -->
      <ellipse cx="300" cy="200" rx="200" ry="80" fill="#d97706" fill-opacity="0.2"/>
      <ellipse cx="300" cy="200" rx="120" ry="50" fill="#f59e0b" fill-opacity="0.15"/>
      <!-- Lock icon bg -->
      <circle cx="300" cy="90" r="55" fill="#d97706" fill-opacity="0.15"/>
      <circle cx="300" cy="90" r="44" fill="#d97706" fill-opacity="0.1"/>
      <text x="300" y="110" text-anchor="middle" font-size="44" fill="#fbbf24" opacity="0.95">🔐</text>
      <text x="300" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#fbbf24">Password Reset Request</text>
      <text x="300" y="172" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">Link expires in 1 hour</text>
    </svg>`,

  donationSuccess: () => `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#be185d"/>
          <stop offset="50%" style="stop-color:#ec4899"/>
          <stop offset="100%" style="stop-color:#f9a8d4"/>
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#dg)" rx="12"/>
      <!-- Heart pulses -->
      <circle cx="300" cy="95" r="70" fill="#ffffff" fill-opacity="0.08"/>
      <circle cx="300" cy="95" r="52" fill="#ffffff" fill-opacity="0.08"/>
      <!-- Floating hearts -->
      <text x="80" y="80" font-size="18" fill="#ffffff" opacity="0.5">💖</text>
      <text x="490" y="60" font-size="14" fill="#ffffff" opacity="0.4">💖</text>
      <text x="520" y="150" font-size="20" fill="#ffffff" opacity="0.3">💖</text>
      <text x="50" y="160" font-size="12" fill="#ffffff" opacity="0.4">💖</text>
      <text x="300" y="110" text-anchor="middle" font-size="46" fill="#ffffff">💖</text>
      <text x="300" y="148" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#ffffff">Thank You for Your Support!</text>
      <text x="300" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#fce7f3">Your donation keeps TickiSpot growing</text>
    </svg>`,

  welcomeSuccess: () => `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wsg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#059669"/>
          <stop offset="50%" style="stop-color:#10b981"/>
          <stop offset="100%" style="stop-color:#34d399"/>
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#wsg)" rx="12"/>
      <circle cx="480" cy="30" r="90" fill="#ffffff" fill-opacity="0.07"/>
      <circle cx="100" cy="180" r="70" fill="#ffffff" fill-opacity="0.07"/>
      <!-- Checkmark glow -->
      <circle cx="300" cy="90" r="52" fill="#ffffff" fill-opacity="0.15"/>
      <text x="300" y="110" text-anchor="middle" font-size="46" fill="#ffffff">✅</text>
      <text x="300" y="148" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#ffffff">Account Verified!</text>
      <text x="300" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#d1fae5">You're officially part of TickiSpot</text>
    </svg>`,

  ticketPurchase: () => `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7c3aed"/>
          <stop offset="100%" style="stop-color:#4f46e5"/>
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#tg)" rx="12"/>
      <!-- Ticket shape bg -->
      <rect x="140" y="60" width="320" height="90" rx="10" fill="#ffffff" fill-opacity="0.12"/>
      <circle cx="140" cy="105" r="15" fill="#7c3aed"/>
      <circle cx="460" cy="105" r="15" fill="#7c3aed"/>
      <line x1="220" y1="60" x2="220" y2="150" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1" stroke-dasharray="4,4"/>
      <!-- Star decorations -->
      <text x="60" y="70" font-size="16" fill="#fbbf24" opacity="0.7">✦</text>
      <text x="520" y="170" font-size="12" fill="#c4b5fd" opacity="0.7">✦</text>
      <text x="300" y="100" text-anchor="middle" font-size="30" fill="#ffffff">🎟️</text>
      <text x="300" y="132" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#ffffff">Ticket Confirmed!</text>
      <text x="300" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#c4b5fd">Your entry pass is ready</text>
    </svg>`,

  organizerAlert: () => `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0369a1"/>
          <stop offset="100%" style="stop-color:#0284c7"/>
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#ag)" rx="12"/>
      <circle cx="550" cy="20" r="80" fill="#ffffff" fill-opacity="0.06"/>
      <circle cx="50" cy="190" r="70" fill="#ffffff" fill-opacity="0.06"/>
      <!-- Notification bell with badge -->
      <text x="265" y="108" font-size="46" fill="#ffffff">🔔</text>
      <circle cx="320" cy="68" r="14" fill="#f43f5e"/>
      <text x="320" y="74" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">NEW</text>
      <text x="300" y="148" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#ffffff">New Ticket Purchase</text>
      <text x="300" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#bae6fd">Someone just bought a ticket for your event</text>
    </svg>`,

  billingSuccess: () => `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#065f46"/>
          <stop offset="50%" style="stop-color:#059669"/>
          <stop offset="100%" style="stop-color:#10b981"/>
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#bg2)" rx="12"/>
      <!-- Coin decorations -->
      <circle cx="80" cy="80" r="22" fill="#fbbf24" fill-opacity="0.2"/>
      <circle cx="80" cy="80" r="16" fill="#fbbf24" fill-opacity="0.15"/>
      <text x="80" y="87" text-anchor="middle" font-size="16" fill="#fbbf24" opacity="0.8">₦</text>
      <circle cx="520" cy="130" r="18" fill="#fbbf24" fill-opacity="0.2"/>
      <circle cx="520" cy="130" r="12" fill="#fbbf24" fill-opacity="0.15"/>
      <text x="520" y="136" text-anchor="middle" font-size="12" fill="#fbbf24" opacity="0.8">₦</text>
      <!-- Stars -->
      <text x="150" y="50" font-size="14" fill="#fbbf24" opacity="0.6">✦</text>
      <text x="440" y="30" font-size="10" fill="#fbbf24" opacity="0.5">✦</text>
      <!-- PRO badge -->
      <rect x="220" y="50" width="160" height="36" rx="18" fill="#ffffff" fill-opacity="0.2"/>
      <text x="300" y="74" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">⚡ PRO ACTIVATED</text>
      <text x="300" y="118" text-anchor="middle" font-size="34" fill="#fbbf24">💳</text>
      <text x="300" y="155" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff">Payment Successful!</text>
      <text x="300" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#a7f3d0">Your subscription is now active</text>
    </svg>`,

  teamInvitation: () => `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tig" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#9d174d"/>
          <stop offset="50%" style="stop-color:#ec4899"/>
          <stop offset="100%" style="stop-color:#a855f7"/>
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#tig)" rx="12"/>
      <circle cx="500" cy="0" r="100" fill="#ffffff" fill-opacity="0.07"/>
      <circle cx="100" cy="200" r="80" fill="#ffffff" fill-opacity="0.07"/>
      <!-- Team avatars -->
      <circle cx="240" cy="88" r="26" fill="#ffffff" fill-opacity="0.2"/>
      <circle cx="300" cy="80" r="30" fill="#ffffff" fill-opacity="0.25"/>
      <circle cx="360" cy="88" r="26" fill="#ffffff" fill-opacity="0.2"/>
      <text x="240" y="97" text-anchor="middle" font-size="24">👤</text>
      <text x="300" y="97" text-anchor="middle" font-size="28">👤</text>
      <text x="360" y="97" text-anchor="middle" font-size="24">👤</text>
      <!-- Plus badge -->
      <circle cx="390" cy="68" r="12" fill="#fbbf24"/>
      <text x="390" y="74" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#7c2d12">+</text>
      <text x="300" y="145" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#ffffff">You're Invited to Join the Team!</text>
      <text x="300" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#fce7f3">Accept your invitation to get started</text>
    </svg>`,
};

// ─── Base Layout ─────────────────────────────────────────────────────────────

const baseLayout = ({ thumbnail, content, footerNote = "" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>TickiSpot</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">

          <!-- Logo Header -->
          <tr>
            <td style="padding-bottom:16px;text-align:center;">
              <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:800;color:#ec4899;letter-spacing:-0.5px;">
                Ticki<span style="color:#0f172a;">Spot</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">

              <!-- Thumbnail -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="line-height:0;border-radius:16px 16px 0 0;overflow:hidden;">
                    ${thumbnail}
                  </td>
                </tr>
              </table>

              <!-- Body Content -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 36px 28px;">
                    ${content}
                  </td>
                </tr>
              </table>

              <!-- Footer note (optional) -->
              ${footerNote ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 36px 28px;">
                    <div style="background:#f8fafc;border-left:3px solid #ec4899;border-radius:6px;padding:12px 16px;">
                      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">${footerNote}</p>
                    </div>
                  </td>
                </tr>
              </table>` : ""}

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 36px;">
                    <hr style="border:none;border-top:1px solid #f1f5f9;margin:0;"/>
                  </td>
                </tr>
              </table>

              <!-- Email Footer -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 36px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                      © ${new Date().getFullYear()} TickiSpot. All rights reserved.
                    </p>
                    <p style="margin:0;font-size:12px;color:#cbd5e1;">
                      <a href="${BASE_URL}/privacy" style="color:#ec4899;text-decoration:none;">Privacy Policy</a>
                      &nbsp;·&nbsp;
                      <a href="${BASE_URL}/terms" style="color:#ec4899;text-decoration:none;">Terms of Service</a>
                      &nbsp;·&nbsp;
                      <a href="${BASE_URL}/unsubscribe" style="color:#94a3b8;text-decoration:none;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Bottom spacer -->
          <tr><td style="height:24px;"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Shared Components ────────────────────────────────────────────────────────

const greeting = (name) =>
  `<p style="margin:0 0 16px;font-size:16px;color:#334155;">Hi <strong style="color:#0f172a;">${name}</strong>,</p>`;

const ctaButton = (href, label, color = "#ec4899") =>
  `<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td style="border-radius:10px;background:${color};">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;

const infoCard = (rows, accentColor = "#ec4899") => {
  const rowsHtml = rows
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:13px;color:#94a3b8;display:block;margin-bottom:2px;">${label}</span>
        <span style="font-size:14px;font-weight:600;color:#0f172a;">${value}</span>
      </td>
    </tr>`
    )
    .join("");
  return `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:20px 0;border-top:3px solid ${accentColor};">
      ${rowsHtml}
    </table>`;
};

const signoff = (team = "The TickiSpot Team") =>
  `<p style="margin:24px 0 0;font-size:15px;color:#475569;">
    Cheers,<br/>
    <strong style="color:#0f172a;">${team}</strong>
    &nbsp;<span style="color:#ec4899;">💖</span>
  </p>`;

const badge = (label, color = "#ec4899", bg = "#fdf2f8") =>
  `<span style="display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;color:${color};background:${bg};letter-spacing:0.4px;">${label}</span>`;

// ─── Email Templates ──────────────────────────────────────────────────────────

exports.welcomeEmail = (name) =>
  baseLayout({
    thumbnail: thumbnails.welcome(),
    content: `
      ${greeting(name)}
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.3;">
        Welcome to TickiSpot! 🎉
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        Your account has been created. You're now part of Africa's fastest-growing event platform.
        Get started by verifying your email and setting up your profile.
      </p>
      ${ctaButton(`${BASE_URL}/verify`, "Verify My Account")}
      ${signoff()}
    `,
    footerNote: "If you didn't create this account, please ignore this email or contact our support team immediately.",
  });

exports.otpEmail = (otp) =>
  baseLayout({
    thumbnail: thumbnails.otp(),
    content: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">Your Verification Code</h2>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
        Use the code below to verify your identity. Do not share this with anyone.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
        <tr>
          <td style="background:#eff6ff;border:2px dashed #2563eb;border-radius:12px;padding:20px 40px;text-align:center;">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#1d4ed8;font-family:'Courier New',monospace;">${otp}</span>
          </td>
        </tr>
      </table>
      ${infoCard([
        ["Status", "Single-use · One-time password"],
        ["Expires", "In 10 minutes"],
        ["Action", "Enter this code on the verification page"],
      ], "#2563eb")}
      ${signoff()}
    `,
    footerNote: "Never share this code with anyone — TickiSpot will never ask for your OTP via phone or email.",
  });

exports.passwordResetEmail = (url) =>
  baseLayout({
    thumbnail: thumbnails.passwordReset(),
    content: `
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f172a;">Password Reset Request</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        We received a request to reset the password for your TickiSpot account.
        Click the button below to choose a new password.
      </p>
      ${ctaButton(url, "Reset My Password", "#d97706")}
      ${infoCard([
        ["Link expires", "In 1 hour"],
        ["Requested from", "TickiSpot Web App"],
        ["If not you", "You can safely ignore this email"],
      ], "#d97706")}
      ${signoff()}
    `,
    footerNote: "For your security, this link can only be used once and will expire in 1 hour. If you didn't request this, no action is needed.",
  });

exports.donationSuccessEmail = (name, amount, reference) =>
  baseLayout({
    thumbnail: thumbnails.donationSuccess(),
    content: `
      ${greeting(name)}
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">Thank You for Your Support! 💖</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        Your generous donation has been received and processed successfully.
        You're helping keep TickiSpot growing and accessible for event creators across Africa.
      </p>
      ${infoCard([
        ["Amount Donated", `<span style="font-size:18px;color:#ec4899;font-weight:800;">₦${amount}</span>`],
        ["Transaction Reference", `<code style="font-family:'Courier New',monospace;background:#f1f5f9;padding:2px 6px;border-radius:4px;">${reference}</code>`],
        ["Status", `${badge("✓ Confirmed", "#16a34a", "#f0fdf4")}`],
        ["Date", new Date().toLocaleDateString("en-NG", { dateStyle: "long" })],
      ], "#ec4899")}
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        A receipt has been recorded for your contribution. Thank you for believing in our mission.
      </p>
      ${signoff()}
    `,
  });

exports.welcomeSuccessEmail = (name) =>
  baseLayout({
    thumbnail: thumbnails.welcomeSuccess(),
    content: `
      ${greeting(name)}
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">You're Officially Verified! 🎉</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        Your account has been verified and you're now fully set up on TickiSpot.
        Here's everything you can do right now:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        ${[
          ["🎟️", "Create &amp; Manage Events", "Build and publish events in minutes"],
          ["📡", "Host Live Events", "Stream to audiences anywhere in Africa"],
          ["💰", "Sell Tickets &amp; Earn", "Accept payments and track revenue"],
          ["📊", "Track Analytics", "Monitor attendance, sales, and insights"],
        ]
          .map(
            ([icon, title, desc]) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:44px;vertical-align:top;">
                    <span style="font-size:24px;">${icon}</span>
                  </td>
                  <td style="vertical-align:top;padding-top:2px;">
                    <strong style="font-size:14px;color:#0f172a;display:block;">${title}</strong>
                    <span style="font-size:13px;color:#94a3b8;">${desc}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
          )
          .join("")}
      </table>
      ${ctaButton(`${BASE_URL}/dashboard`, "Go to Dashboard")}
      ${signoff()}
    `,
  });

exports.ticketPurchaseEmail = (name, eventTitle, quantity) =>
  baseLayout({
    thumbnail: thumbnails.ticketPurchase(),
    content: `
      ${greeting(name)}
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">Your Ticket is Confirmed! 🎟️</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        You're all set! Here are your ticket details. Your QR code is attached — present it at the entrance.
      </p>
      ${infoCard([
        ["Event", `<strong>${eventTitle}</strong>`],
        ["Tickets", `${quantity} × General Admission`],
        ["Status", `${badge("✓ Confirmed", "#7c3aed", "#f5f3ff")}`],
        ["Entry", "Show QR code at the gate"],
      ], "#7c3aed")}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td style="text-align:center;background:#f5f3ff;border-radius:12px;padding:24px;border:1px dashed #a78bfa;">
            <p style="margin:0 0 12px;font-size:13px;color:#7c3aed;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your QR Code</p>
            <img src="cid:ticketqr" width="160" height="160"
                 style="display:block;margin:0 auto;border-radius:8px;"
                 alt="Ticket QR Code"/>
            <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">Scan at venue entry · Do not share publicly</p>
          </td>
        </tr>
      </table>
      ${signoff()}
    `,
    footerNote: "Keep this email safe. Your QR code is your entry pass — it's unique to your ticket and cannot be reused.",
  });

exports.organizerTicketAlertEmail = (organizerName, eventTitle, buyerName, quantity) =>
  baseLayout({
    thumbnail: thumbnails.organizerAlert(),
    content: `
      ${greeting(organizerName)}
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">New Ticket Purchase 🎉</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        Great news — someone just bought a ticket for your event! Here are the details:
      </p>
      ${infoCard([
        ["Event", `<strong>${eventTitle}</strong>`],
        ["Buyer", buyerName],
        ["Tickets Sold", `${quantity} ticket${quantity > 1 ? "s" : ""}`],
        ["Time", new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })],
      ], "#0284c7")}
      ${ctaButton(`${BASE_URL}/dashboard/events`, "View Event Dashboard", "#0284c7")}
      ${signoff()}
    `,
    footerNote: "This is an automated notification. Visit your organizer dashboard for full sales reporting and attendee management.",
  });

exports.billingSuccessEmail = (name, plan, amount, interval, reference) =>
  baseLayout({
    thumbnail: thumbnails.billingSuccess(),
    content: `
      ${greeting(name)}
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">Payment Successful! 🚀</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        Your TickiSpot <strong>${plan.toUpperCase()}</strong> subscription is now active.
        You have full access to all premium features.
      </p>
      ${infoCard([
        ["Plan", `${badge("⚡ " + plan.toUpperCase(), "#059669", "#f0fdf4")}`],
        ["Billing Cycle", interval.charAt(0).toUpperCase() + interval.slice(1)],
        ["Amount Charged", `<span style="font-size:18px;font-weight:800;color:#059669;">₦${amount}</span>`],
        ["Reference", `<code style="font-family:'Courier New',monospace;background:#f1f5f9;padding:2px 6px;border-radius:4px;">${reference}</code>`],
        ["Status", `${badge("✓ Active", "#059669", "#f0fdf4")}`],
        ["Date", new Date().toLocaleDateString("en-NG", { dateStyle: "long" })],
      ], "#059669")}
      ${ctaButton(`${BASE_URL}/dashboard`, "Go to Dashboard", "#059669")}
      ${signoff()}
    `,
    footerNote: "Save this email as your payment receipt. To manage your subscription, visit your billing settings in the dashboard.",
  });

exports.teamInvitationEmail = (name, eventTitle, role, acceptUrl) =>
  baseLayout({
    thumbnail: thumbnails.teamInvitation(),
    content: `
      ${greeting(name)}
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0f172a;">You're Invited to Join the Team! 🎟️</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
        An event organizer on TickiSpot has invited you to collaborate on an upcoming event.
        Review the details below and accept to get started.
      </p>
      ${infoCard([
        ["Event", `<strong>${eventTitle}</strong>`],
        ["Your Role", `${badge(role.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), "#ec4899", "#fdf2f8")}`],
        ["Platform", "TickiSpot"],
        ["Invitation Expires", "In 7 days"],
      ], "#ec4899")}
      <p style="margin:0 0 4px;font-size:15px;color:#475569;line-height:1.7;">
        As a team member, you'll get access to event management tools based on your assigned permissions.
      </p>
      ${ctaButton(acceptUrl, "Accept Invitation")}
      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
        Not interested? You can safely ignore this email or
        <a href="${BASE_URL}/invitations/decline" style="color:#ec4899;">decline here</a>.
      </p>
      ${signoff()}
    `,
    footerNote: "This invitation expires in 7 days. You can accept or decline from your TickiSpot dashboard at any time.",
  });