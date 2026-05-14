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

// ─── SVG Thumbnail Generators (full-width, responsive) ────────────────────────

const thumbnails = {
  welcome: () => `
    <svg width="100%" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;">
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
      <rect width="700" height="220" fill="url(#wg)"/>
      <circle cx="620" cy="40" r="100" fill="url(#wg2)"/>
      <circle cx="80" cy="200" r="80" fill="url(#wg2)"/>
      <circle cx="350" cy="-20" r="110" fill="#ffffff" fill-opacity="0.04"/>
      <circle cx="60" cy="60" r="4" fill="#ffffff" fill-opacity="0.6"/>
      <circle cx="130" cy="30" r="3" fill="#fbbf24" fill-opacity="0.8"/>
      <circle cx="200" cy="90" r="5" fill="#ffffff" fill-opacity="0.4"/>
      <circle cx="530" cy="55" r="3" fill="#fbbf24" fill-opacity="0.8"/>
      <circle cx="590" cy="160" r="4" fill="#ffffff" fill-opacity="0.5"/>
      <circle cx="430" cy="185" r="3" fill="#fbbf24" fill-opacity="0.7"/>
      <circle cx="280" cy="45" r="2" fill="#ffffff" fill-opacity="0.6"/>
      <circle cx="380" cy="178" r="5" fill="#ffffff" fill-opacity="0.3"/>
      <text x="150" y="65" font-size="16" fill="#fbbf24" opacity="0.9">✦</text>
      <text x="520" y="175" font-size="12" fill="#ffffff" opacity="0.7">✦</text>
      <text x="390" y="50" font-size="10" fill="#fbbf24" opacity="0.8">✦</text>
      <rect x="255" y="62" width="190" height="48" rx="24" fill="#ffffff" fill-opacity="0.18"/>
      <text x="350" y="93" text-anchor="middle" font-family="Georgia,serif" font-size="20" font-weight="bold" fill="#ffffff">TickiSpot 🎉</text>
      <text x="350" y="148" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#ffffff" fill-opacity="0.92">Welcome to the platform</text>
      <text x="350" y="172" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#ffffff" fill-opacity="0.7">Your events journey starts here</text>
    </svg>`,

  otp: () => `
    <svg width="100%" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;">
      <defs>
        <linearGradient id="og" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e40af"/>
          <stop offset="100%" style="stop-color:#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="700" height="220" fill="url(#og)"/>
      <line x1="0" y1="44" x2="700" y2="44" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="0" y1="88" x2="700" y2="88" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="0" y1="132" x2="700" y2="132" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="0" y1="176" x2="700" y2="176" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="100" y1="0" x2="100" y2="220" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="200" y1="0" x2="200" y2="220" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="350" y1="0" x2="350" y2="220" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="500" y1="0" x2="500" y2="220" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <line x1="600" y1="0" x2="600" y2="220" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <text x="350" y="108" text-anchor="middle" font-size="48" fill="#ffffff" opacity="0.92">🛡️</text>
      <text x="350" y="152" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-weight="bold" fill="#ffffff">Verification Code</text>
      <text x="350" y="176" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#93c5fd">Expires in 10 minutes · Do not share</text>
    </svg>`,

  passwordReset: () => `
    <svg width="100%" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;">
      <defs>
        <linearGradient id="prg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f172a"/>
          <stop offset="100%" style="stop-color:#1e293b"/>
        </linearGradient>
      </defs>
      <rect width="700" height="220" fill="url(#prg)"/>
      <ellipse cx="350" cy="220" rx="240" ry="90" fill="#d97706" fill-opacity="0.18"/>
      <ellipse cx="350" cy="220" rx="140" ry="55" fill="#f59e0b" fill-opacity="0.12"/>
      <circle cx="350" cy="100" r="60" fill="#d97706" fill-opacity="0.13"/>
      <circle cx="350" cy="100" r="46" fill="#d97706" fill-opacity="0.1"/>
      <text x="350" y="120" text-anchor="middle" font-size="48" fill="#fbbf24" opacity="0.95">🔐</text>
      <text x="350" y="162" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#fbbf24">Password Reset Request</text>
      <text x="350" y="186" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#94a3b8">Link expires in 1 hour</text>
    </svg>`,

  donationSuccess: () => `
    <svg width="100%" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;">
      <defs>
        <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#be185d"/>
          <stop offset="50%" style="stop-color:#ec4899"/>
          <stop offset="100%" style="stop-color:#f9a8d4"/>
        </linearGradient>
      </defs>
      <rect width="700" height="220" fill="url(#dg)"/>
      <circle cx="350" cy="100" r="78" fill="#ffffff" fill-opacity="0.07"/>
      <circle cx="350" cy="100" r="56" fill="#ffffff" fill-opacity="0.07"/>
      <text x="90" y="88" font-size="20" fill="#ffffff" opacity="0.45">💖</text>
      <text x="570" y="68" font-size="15" fill="#ffffff" opacity="0.38">💖</text>
      <text x="610" y="168" font-size="22" fill="#ffffff" opacity="0.28">💖</text>
      <text x="55" y="180" font-size="13" fill="#ffffff" opacity="0.38">💖</text>
      <text x="350" y="118" text-anchor="middle" font-size="50" fill="#ffffff">💖</text>
      <text x="350" y="162" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#ffffff">Thank You for Your Support!</text>
      <text x="350" y="186" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#fce7f3">Your donation keeps TickiSpot growing</text>
    </svg>`,

  welcomeSuccess: () => `
    <svg width="100%" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;">
      <defs>
        <linearGradient id="wsg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#059669"/>
          <stop offset="50%" style="stop-color:#10b981"/>
          <stop offset="100%" style="stop-color:#34d399"/>
        </linearGradient>
      </defs>
      <rect width="700" height="220" fill="url(#wsg)"/>
      <circle cx="570" cy="30" r="100" fill="#ffffff" fill-opacity="0.06"/>
      <circle cx="110" cy="200" r="80" fill="#ffffff" fill-opacity="0.06"/>
      <circle cx="350" cy="100" r="58" fill="#ffffff" fill-opacity="0.14"/>
      <text x="350" y="120" text-anchor="middle" font-size="50" fill="#ffffff">✅</text>
      <text x="350" y="162" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#ffffff">Account Verified!</text>
      <text x="350" y="186" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#d1fae5">You're officially part of TickiSpot</text>
    </svg>`,

  ticketPurchase: () => `
    <svg width="100%" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;">
      <defs>
        <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7c3aed"/>
          <stop offset="100%" style="stop-color:#4f46e5"/>
        </linearGradient>
      </defs>
      <rect width="700" height="220" fill="url(#tg)"/>
      <rect x="160" y="68" width="380" height="100" rx="12" fill="#ffffff" fill-opacity="0.1"/>
      <circle cx="160" cy="118" r="18" fill="#7c3aed"/>
      <circle cx="540" cy="118" r="18" fill="#7c3aed"/>
      <line x1="256" y1="68" x2="256" y2="168" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1" stroke-dasharray="4,4"/>
      <text x="68" y="80" font-size="17" fill="#fbbf24" opacity="0.7">✦</text>
      <text x="610" y="188" font-size="13" fill="#c4b5fd" opacity="0.7">✦</text>
      <text x="350" y="112" text-anchor="middle" font-size="34" fill="#ffffff">🎟️</text>
      <text x="350" y="146" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#ffffff">Ticket Confirmed!</text>
      <text x="350" y="184" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#c4b5fd">Your entry pass is ready</text>
    </svg>`,

  organizerAlert: () => `
    <svg width="100%" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;">
      <defs>
        <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0369a1"/>
          <stop offset="100%" style="stop-color:#0284c7"/>
        </linearGradient>
      </defs>
      <rect width="700" height="220" fill="url(#ag)"/>
      <circle cx="650" cy="20" r="90" fill="#ffffff" fill-opacity="0.05"/>
      <circle cx="55" cy="210" r="80" fill="#ffffff" fill-opacity="0.05"/>
      <text x="310" y="120" font-size="50" fill="#ffffff">🔔</text>
      <circle cx="376" cy="76" r="16" fill="#f43f5e"/>
      <text x="376" y="83" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="bold" fill="#ffffff">NEW</text>
      <text x="350" y="162" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#ffffff">New Ticket Purchase</text>
      <text x="350" y="186" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#bae6fd">Someone just bought a ticket for your event</text>
    </svg>`,

  billingSuccess: () => `
    <svg width="100%" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;">
      <defs>
        <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#065f46"/>
          <stop offset="50%" style="stop-color:#059669"/>
          <stop offset="100%" style="stop-color:#10b981"/>
        </linearGradient>
      </defs>
      <rect width="700" height="220" fill="url(#bg2)"/>
      <circle cx="88" cy="88" r="24" fill="#fbbf24" fill-opacity="0.18"/>
      <circle cx="88" cy="88" r="17" fill="#fbbf24" fill-opacity="0.13"/>
      <text x="88" y="96" text-anchor="middle" font-size="17" fill="#fbbf24" opacity="0.8">₦</text>
      <circle cx="608" cy="145" r="20" fill="#fbbf24" fill-opacity="0.18"/>
      <circle cx="608" cy="145" r="13" fill="#fbbf24" fill-opacity="0.13"/>
      <text x="608" y="151" text-anchor="middle" font-size="12" fill="#fbbf24" opacity="0.8">₦</text>
      <text x="170" y="55" font-size="14" fill="#fbbf24" opacity="0.6">✦</text>
      <text x="510" y="35" font-size="10" fill="#fbbf24" opacity="0.5">✦</text>
      <rect x="250" y="55" width="200" height="40" rx="20" fill="#ffffff" fill-opacity="0.18"/>
      <text x="350" y="82" text-anchor="middle" font-family="Georgia,serif" font-size="15" font-weight="bold" fill="#ffffff">⚡ PRO ACTIVATED</text>
      <text x="350" y="128" text-anchor="middle" font-size="36" fill="#fbbf24">💳</text>
      <text x="350" y="168" text-anchor="middle" font-family="Georgia,serif" font-size="15" font-weight="bold" fill="#ffffff">Payment Successful!</text>
      <text x="350" y="190" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#a7f3d0">Your subscription is now active</text>
    </svg>`,

  teamInvitation: () => `
    <svg width="100%" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;">
      <defs>
        <linearGradient id="tig" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#9d174d"/>
          <stop offset="50%" style="stop-color:#ec4899"/>
          <stop offset="100%" style="stop-color:#a855f7"/>
        </linearGradient>
      </defs>
      <rect width="700" height="220" fill="url(#tig)"/>
      <circle cx="600" cy="0" r="110" fill="#ffffff" fill-opacity="0.06"/>
      <circle cx="110" cy="220" r="90" fill="#ffffff" fill-opacity="0.06"/>
      <circle cx="280" cy="96" r="28" fill="#ffffff" fill-opacity="0.18"/>
      <circle cx="350" cy="88" r="33" fill="#ffffff" fill-opacity="0.23"/>
      <circle cx="420" cy="96" r="28" fill="#ffffff" fill-opacity="0.18"/>
      <text x="280" y="106" text-anchor="middle" font-size="26">👤</text>
      <text x="350" y="106" text-anchor="middle" font-size="30">👤</text>
      <text x="420" y="106" text-anchor="middle" font-size="26">👤</text>
      <circle cx="456" cy="72" r="14" fill="#fbbf24"/>
      <text x="456" y="79" text-anchor="middle" font-family="Georgia,serif" font-size="15" font-weight="bold" fill="#7c2d12">+</text>
      <text x="350" y="158" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="#ffffff">You're Invited to Join the Team!</text>
      <text x="350" y="182" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#fce7f3">Accept your invitation to get started</text>
    </svg>`,
};

// ─── Base Layout (true full-width) ───────────────────────────────────────────

const baseLayout = ({ thumbnail, content, footerNote = "" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>TickiSpot</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: Georgia, 'Times New Roman', serif; -webkit-font-smoothing: antialiased; }
    .email-wrapper { width: 100%; background-color: #f1f5f9; padding: 32px 0; }
    .email-card { width: 100%; max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 6px 32px rgba(0,0,0,0.10); border: 1px solid #e2e8f0; }
    .thumbnail-wrap { line-height: 0; display: block; width: 100%; }
    .thumbnail-wrap svg { display: block; width: 100%; height: auto; }
    .body-pad { padding: 36px 44px 28px; }
    .footer-note { margin: 0 44px 28px; background: #f8fafc; border-left: 3px solid #ec4899; border-radius: 6px; padding: 12px 18px; }
    .footer-note p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.65; font-family: Georgia, serif; }
    .email-footer { padding: 20px 44px; text-align: center; border-top: 1px solid #f1f5f9; }
    .email-footer p { margin: 0; font-size: 12px; color: #94a3b8; font-family: Georgia, serif; }
    .email-footer a { color: #ec4899; text-decoration: none; }
    @media only screen and (max-width: 640px) {
      .email-card { border-radius: 0 !important; }
      .body-pad { padding: 24px 20px 20px !important; }
      .footer-note { margin: 0 20px 20px !important; }
      .email-footer { padding: 16px 20px !important; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">

    <!-- Logo Header -->
    <div style="text-align:center;padding-bottom:18px;">
      <span style="font-family:Georgia,serif;font-size:24px;font-weight:800;color:#ec4899;letter-spacing:-0.5px;">
        Ticki<span style="color:#0f172a;">Spot</span>
      </span>
    </div>

    <!-- Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;">
      <tr>
        <td>
          <div class="email-card">

            <!-- Thumbnail -->
            <div class="thumbnail-wrap">
              ${thumbnail}
            </div>

            <!-- Body Content -->
            <div class="body-pad">
              ${content}
            </div>

            <!-- Footer Note -->
            ${footerNote ? `
            <div class="footer-note">
              <p>${footerNote}</p>
            </div>` : ""}

            <!-- Email Footer -->
            <div class="email-footer">
              <p style="margin-bottom:8px;">© ${new Date().getFullYear()} TickiSpot. All rights reserved.</p>
              <p>
                <a href="${BASE_URL}/privacy">Privacy Policy</a>
                &nbsp;·&nbsp;
                <a href="${BASE_URL}/terms">Terms of Service</a>
                &nbsp;·&nbsp;
                <a href="${BASE_URL}/unsubscribe" style="color:#94a3b8;">Unsubscribe</a>
              </p>
            </div>

          </div>
        </td>
      </tr>
    </table>

    <!-- Bottom spacer -->
    <div style="height:32px;"></div>
  </div>
</body>
</html>`;

// ─── Shared Components ────────────────────────────────────────────────────────

const greeting = (name) =>
  `<p style="margin:0 0 16px;font-size:16px;color:#334155;font-family:Georgia,serif;">Hi <strong style="color:#0f172a;">${name}</strong>,</p>`;

const ctaButton = (href, label, color = "#ec4899") =>
  `<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td style="border-radius:10px;background:${color};">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.3px;font-family:Georgia,serif;">
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
      <td style="padding:11px 18px;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:12px;color:#94a3b8;display:block;margin-bottom:3px;font-family:Georgia,serif;text-transform:uppercase;letter-spacing:0.4px;">${label}</span>
        <span style="font-size:14px;font-weight:600;color:#0f172a;font-family:Georgia,serif;">${value}</span>
      </td>
    </tr>`
    )
    .join("");
  return `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:20px 0;border-top:3px solid ${accentColor};">
      ${rowsHtml}
    </table>`;
};

const signoff = (team = "The TickiSpot Team") =>
  `<p style="margin:28px 0 0;font-size:15px;color:#475569;font-family:Georgia,serif;">
    Cheers,<br/>
    <strong style="color:#0f172a;">${team}</strong>
    &nbsp;<span style="color:#ec4899;">💖</span>
  </p>`;

const badge = (label, color = "#ec4899", bg = "#fdf2f8") =>
  `<span style="display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;color:${color};background:${bg};letter-spacing:0.4px;font-family:Georgia,serif;">${label}</span>`;

// ─── Email Templates ──────────────────────────────────────────────────────────

exports.welcomeEmail = (name) =>
  baseLayout({
    thumbnail: thumbnails.welcome(),
    content: `
      ${greeting(name)}
      <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#0f172a;line-height:1.3;font-family:Georgia,serif;">
        Welcome to TickiSpot! 🎉
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
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
      <h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#0f172a;font-family:Georgia,serif;">Your Verification Code</h2>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
        Use the code below to verify your identity. Do not share this with anyone.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
        <tr>
          <td style="background:#eff6ff;border:2px dashed #2563eb;border-radius:14px;padding:22px 48px;text-align:center;">
            <span style="font-size:44px;font-weight:900;letter-spacing:14px;color:#1d4ed8;font-family:'Courier New',monospace;">${otp}</span>
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
      <h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#0f172a;font-family:Georgia,serif;">Password Reset Request</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
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
      <h2 style="margin:0 0 14px;font-size:24px;font-weight:800;color:#0f172a;font-family:Georgia,serif;">Thank You for Your Support! 💖</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
        Your generous donation has been received and processed successfully.
        You're helping keep TickiSpot growing and accessible for event creators across Africa.
      </p>
      ${infoCard([
        ["Amount Donated", `<span style="font-size:20px;color:#ec4899;font-weight:800;font-family:Georgia,serif;">₦${Number(amount).toLocaleString("en-NG")}</span>`],
        ["Transaction Reference", `<code style="font-family:'Courier New',monospace;background:#f1f5f9;padding:2px 8px;border-radius:5px;font-size:13px;">${reference}</code>`],
        ["Status", `${badge("✓ Confirmed", "#16a34a", "#f0fdf4")}`],
        ["Date", new Date().toLocaleDateString("en-NG", { dateStyle: "long" })],
      ], "#ec4899")}
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
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
      <h2 style="margin:0 0 14px;font-size:24px;font-weight:800;color:#0f172a;font-family:Georgia,serif;">You're Officially Verified! 🎉</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
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
            <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:46px;vertical-align:top;">
                    <span style="font-size:26px;">${icon}</span>
                  </td>
                  <td style="vertical-align:top;padding-top:3px;">
                    <strong style="font-size:14px;color:#0f172a;display:block;font-family:Georgia,serif;">${title}</strong>
                    <span style="font-size:13px;color:#94a3b8;font-family:Georgia,serif;">${desc}</span>
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
      <h2 style="margin:0 0 14px;font-size:24px;font-weight:800;color:#0f172a;font-family:Georgia,serif;">Your Ticket is Confirmed! 🎟️</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
        You're all set! Here are your ticket details. Your QR code is attached — present it at the entrance.
      </p>
      ${infoCard([
        ["Event", `<strong style="font-family:Georgia,serif;">${eventTitle}</strong>`],
        ["Tickets", `${quantity} × General Admission`],
        ["Status", `${badge("✓ Confirmed", "#7c3aed", "#f5f3ff")}`],
        ["Entry", "Show QR code at the gate"],
      ], "#7c3aed")}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td style="text-align:center;background:#f5f3ff;border-radius:14px;padding:28px;border:1px dashed #a78bfa;">
            <p style="margin:0 0 14px;font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;font-family:Georgia,serif;">Your QR Code</p>
            <img src="cid:ticketqr" width="160" height="160"
                 style="display:block;margin:0 auto;border-radius:10px;"
                 alt="Ticket QR Code"/>
            <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;font-family:Georgia,serif;">Scan at venue entry · Do not share publicly</p>
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
      <h2 style="margin:0 0 14px;font-size:24px;font-weight:800;color:#0f172a;font-family:Georgia,serif;">New Ticket Purchase 🎉</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
        Great news — someone just bought a ticket for your event! Here are the details:
      </p>
      ${infoCard([
        ["Event", `<strong style="font-family:Georgia,serif;">${eventTitle}</strong>`],
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
      <h2 style="margin:0 0 14px;font-size:24px;font-weight:800;color:#0f172a;font-family:Georgia,serif;">Payment Successful! 🚀</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
        Your TickiSpot <strong>${plan.toUpperCase()}</strong> subscription is now active.
        You have full access to all premium features.
      </p>
      ${infoCard([
        ["Plan", `${badge("⚡ " + plan.toUpperCase(), "#059669", "#f0fdf4")}`],
        ["Billing Cycle", interval.charAt(0).toUpperCase() + interval.slice(1)],
        ["Amount Charged", `<span style="font-size:20px;font-weight:800;color:#059669;font-family:Georgia,serif;">₦${Number(amount).toLocaleString("en-NG")}</span>`],
        ["Reference", `<code style="font-family:'Courier New',monospace;background:#f1f5f9;padding:2px 8px;border-radius:5px;font-size:13px;">${reference}</code>`],
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
      <h2 style="margin:0 0 14px;font-size:24px;font-weight:800;color:#0f172a;font-family:Georgia,serif;">You're Invited to Join the Team! 🎟️</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
        An event organizer on TickiSpot has invited you to collaborate on an upcoming event.
        Review the details below and accept to get started.
      </p>
      ${infoCard([
        ["Event", `<strong style="font-family:Georgia,serif;">${eventTitle}</strong>`],
        ["Your Role", `${badge(role.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), "#ec4899", "#fdf2f8")}`],
        ["Platform", "TickiSpot"],
        ["Invitation Expires", "In 7 days"],
      ], "#ec4899")}
      <p style="margin:0 0 6px;font-size:15px;color:#475569;line-height:1.75;font-family:Georgia,serif;">
        As a team member, you'll get access to event management tools based on your assigned permissions.
      </p>
      ${ctaButton(acceptUrl, "Accept Invitation")}
      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;font-family:Georgia,serif;">
        Not interested? You can safely ignore this email or
        <a href="${BASE_URL}/invitations/decline" style="color:#ec4899;text-decoration:none;">decline here</a>.
      </p>
      ${signoff()}
    `,
    footerNote: "This invitation expires in 7 days. You can accept or decline from your TickiSpot dashboard at any time.",
  });