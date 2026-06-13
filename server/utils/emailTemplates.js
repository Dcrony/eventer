// utils/emailTemplates.js
// TickiSpot — Clean professional tech email templates

const BASE_URL = process.env.FRONTEND_URL || "https://tickispot.com";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const t = {
  pink:       "#EC4899",
  pinkDark:   "#BE185D",
  dark:       "#0A0A0A",
  text:       "#1A1A1A",
  muted:      "#6B7280",
  subtle:     "#9CA3AF",
  border:     "#E5E7EB",
  surfaceBg:  "#F9FAFB",
  white:      "#FFFFFF",
  green:      "#16A34A",
  greenBg:    "#F0FDF4",
  greenBorder:"#BBF7D0",
  blue:       "#2563EB",
  blueBg:     "#EFF6FF",
  blueBorder: "#BFDBFE",
  amber:      "#D97706",
  amberBg:    "#FFFBEB",
  amberBorder:"#FDE68A",
  red:        "#DC2626",
  redBg:      "#FEF2F2",
  redBorder:  "#FECACA",
  purple:     "#7C3AED",
  purpleBg:   "#F5F3FF",
  purpleBorder:"#DDD6FE",
};

// ─── Banner Generators ────────────────────────────────────────────────────────
// Clean monochrome banners: dark bg + pink left-edge accent stripe + bold label

const banner = ({ label, sublabel = "", icon = "◈", accentColor = t.pink, bgColor = t.dark }) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0;">
    <tr>
      <td style="background:${bgColor};padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:4px;background:${accentColor};padding:0;font-size:0;line-height:0;">&nbsp;</td>
            <td style="padding:36px 40px 36px 36px;">
              <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:28px;color:${accentColor};line-height:1;display:block;margin-bottom:12px;">${icon}</span>
              <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;line-height:1.2;display:block;">${label}</span>
              ${sublabel ? `<span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.5);display:block;margin-top:6px;letter-spacing:0.2px;">${sublabel}</span>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

const banners = {
  welcome:               () => banner({ label: "Welcome to TickiSpot", sublabel: "Account created successfully", icon: "⬡" }),
  otp:                   () => banner({ label: "Verification Code", sublabel: "Single use · Expires in 10 minutes", icon: "⊕", accentColor: t.blue }),
  passwordReset:         () => banner({ label: "Password Reset", sublabel: "Link expires in 1 hour", icon: "⊘", accentColor: t.amber }),
  ticketPurchase:        () => banner({ label: "Booking Confirmed", sublabel: "Your ticket is ready", icon: "◧", accentColor: t.purple }),
  organizerAlert:        () => banner({ label: "New Ticket Sale", sublabel: "Someone just bought a ticket", icon: "◑", accentColor: t.blue }),
  donationSuccess:       () => banner({ label: "Donation Received", sublabel: "Thank you for your support", icon: "◈" }),
  billingSuccess:        () => banner({ label: "Payment Successful", sublabel: "Your subscription is now active", icon: "◈", accentColor: t.green }),
  teamInvitation:        () => banner({ label: "Team Invitation", sublabel: "You've been invited to collaborate", icon: "◫" }),
  verificationRequest:   () => banner({ label: "Verification Submitted", sublabel: "We'll review this shortly", icon: "◎", accentColor: t.blue }),
  verificationApproved:  () => banner({ label: "Verification Approved", sublabel: "Your account is now verified", icon: "◉", accentColor: t.green }),
  verificationRejected:  () => banner({ label: "Verification Declined", sublabel: "Action required", icon: "◌", accentColor: t.red }),
  welcomeSuccess:        () => banner({ label: "Account Verified", sublabel: "You're all set on TickiSpot", icon: "◉", accentColor: t.green }),
};

// ─── Base Layout ──────────────────────────────────────────────────────────────

const baseLayout = ({ banner: bannerHtml, content, footerNote = "" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>TickiSpot</title>
  <style>
    body{margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
    a{color:${t.pink};text-decoration:none;}
    @media only screen and (max-width:620px){
      .card{border-radius:0!important;}
      .body-pad{padding:28px 24px!important;}
      .footer-wrap{padding:16px 24px!important;}
    }
  </style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 0;">
  <tr>
    <td align="center">

      <!-- Wordmark -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin-bottom:24px;">
        <tr>
          <td style="padding:0 0 0 4px;">
            <span style="font-size:15px;font-weight:700;color:${t.pink};letter-spacing:-0.3px;">Ticki<span style="color:${t.dark};">Spot</span></span>
          </td>
        </tr>
      </table>

      <!-- Card -->
      <table class="card" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:${t.white};border-radius:12px;overflow:hidden;border:1px solid ${t.border};">
        <tr>
          <td style="padding:0;">

            <!-- Banner -->
            ${bannerHtml}

            <!-- Body -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="body-pad" style="padding:36px 40px 28px;">
                  ${content}
                </td>
              </tr>
            </table>

            ${footerNote ? `
            <!-- Footer note -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 40px 28px;">
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="background:${t.surfaceBg};border:1px solid ${t.border};border-radius:8px;">
                    <tr>
                      <td style="width:3px;background:${t.border};border-radius:8px 0 0 8px;font-size:0;">&nbsp;</td>
                      <td style="padding:12px 16px;font-size:12px;color:${t.muted};line-height:1.6;">
                        ${footerNote}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>` : ""}

          </td>
        </tr>
      </table>

      <!-- Footer links -->
      <table class="footer-wrap" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;padding:20px 0 0;">
        <tr>
          <td style="text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:${t.subtle};">
              © ${new Date().getFullYear()} TickiSpot Technologies Ltd. All rights reserved.
            </p>
            <p style="margin:0;font-size:12px;">
              <a href="${BASE_URL}/privacy" style="color:${t.muted};text-decoration:none;">Privacy</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${BASE_URL}/terms" style="color:${t.muted};text-decoration:none;">Terms</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${BASE_URL}/unsubscribe" style="color:${t.muted};text-decoration:none;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`;

// ─── Shared Components ────────────────────────────────────────────────────────

const greeting = (name) =>
  `<p style="margin:0 0 20px;font-size:15px;color:${t.text};line-height:1.6;">Hi <strong>${name}</strong>,</p>`;

const body = (text) =>
  `<p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">${text}</p>`;

const ctaButton = (href, label, color = t.pink) =>
  `<table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
    <tr>
      <td style="background:${color};border-radius:8px;">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;letter-spacing:0.1px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;

const divider = () =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="border-top:1px solid ${t.border};font-size:0;">&nbsp;</td></tr>
  </table>`;

const infoTable = (rows, accentColor = t.pink) => {
  const rowsHtml = rows.map(([label, value], i) => `
    <tr>
      <td style="padding:11px 16px;${i > 0 ? `border-top:1px solid ${t.border};` : ""}vertical-align:top;">
        <span style="font-size:11px;font-weight:600;color:${t.subtle};text-transform:uppercase;letter-spacing:0.6px;display:block;margin-bottom:3px;">${label}</span>
        <span style="font-size:14px;color:${t.text};">${value}</span>
      </td>
    </tr>`).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid ${t.border};border-radius:8px;overflow:hidden;margin:20px 0;border-top:2px solid ${accentColor};">
      ${rowsHtml}
    </table>`;
};

const pill = (label, color = t.pink, bg = "#FDF2F8") =>
  `<span style="display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;color:${color};background:${bg};letter-spacing:0.2px;">${label}</span>`;

const signoff = () =>
  `${divider()}
  <p style="margin:0;font-size:14px;color:${t.muted};line-height:1.75;">
    The TickiSpot Team<br/>
    <span style="font-size:12px;color:${t.subtle};">
      <a href="${BASE_URL}/support" style="color:${t.subtle};text-decoration:none;">support@tickispot.com</a>
    </span>
  </p>`;

const alertBox = (text, color = t.amber, bg = "#FFFBEB", borderColor = "#FDE68A") =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background:${bg};border:1px solid ${borderColor};border-left:3px solid ${color};border-radius:6px;padding:14px 16px;">
        <p style="margin:0;font-size:14px;color:${t.text};line-height:1.65;">${text}</p>
      </td>
    </tr>
  </table>`;

// ─── Email Templates ──────────────────────────────────────────────────────────

exports.welcomeEmail = (name) =>
  baseLayout({
    banner: banners.welcome(),
    content: `
      ${greeting(name)}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        Your TickiSpot account has been created. You're now on Africa's leading event and ticketing platform.
        Verify your email to unlock all features.
      </p>
      ${ctaButton(`${BASE_URL}/verify`, "Verify my account")}
      ${signoff()}
    `,
    footerNote: "If you didn't create this account, you can safely ignore this email or contact our support team.",
  });

exports.otpEmail = (otp) =>
  baseLayout({
    banner: banners.otp(),
    content: `
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        Use the code below to complete verification. Do not share this with anyone — TickiSpot staff will never ask for your OTP.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background:${t.blueBg};border:1px solid ${t.blueBorder};border-radius:8px;padding:20px 40px;text-align:center;">
            <span style="font-size:40px;font-weight:800;letter-spacing:16px;color:${t.blue};font-family:'Courier New',Courier,monospace;">${otp}</span>
          </td>
        </tr>
      </table>
      ${infoTable([
        ["Valid for",  "10 minutes"],
        ["Use",       "One-time only — cannot be reused"],
      ], t.blue)}
      ${signoff()}
    `,
    footerNote: "Never share this code. TickiSpot will never ask for your OTP via phone or email.",
  });

exports.passwordResetEmail = (url) =>
  baseLayout({
    banner: banners.passwordReset(),
    content: `
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        We received a request to reset your TickiSpot account password. Click the button below to set a new one.
      </p>
      ${ctaButton(url, "Reset my password", t.amber)}
      ${infoTable([
        ["Link expires", "In 1 hour"],
        ["Single use",   "This link can only be used once"],
        ["Not you?",     "No action needed — your account is safe"],
      ], t.amber)}
      ${signoff()}
    `,
    footerNote: "For security, this link expires in 1 hour and can only be used once. If you didn't request this, no action is needed.",
  });

exports.donationSuccessEmail = (name, amount, reference) =>
  baseLayout({
    banner: banners.donationSuccess(),
    content: `
      ${greeting(name)}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        Your donation was received and processed successfully. Thank you for helping keep TickiSpot growing for event creators across Africa.
      </p>
      ${infoTable([
        ["Amount",    `<strong style="font-size:18px;color:${t.pink};">₦${Number(amount).toLocaleString("en-NG")}</strong>`],
        ["Reference", `<code style="font-family:'Courier New',monospace;background:${t.surfaceBg};padding:2px 8px;border-radius:4px;font-size:13px;">${reference}</code>`],
        ["Status",    pill("Confirmed", t.green, t.greenBg)],
        ["Date",      new Date().toLocaleDateString("en-NG", { dateStyle: "long" })],
      ], t.pink)}
      ${signoff()}
    `,
  });

exports.donationAdminNotificationEmail = (donorName, donorEmail, amount, reference, donationDate) =>
  baseLayout({
    banner: banners.donationSuccess(),
    content: `
      ${greeting("TickiSpot Team")}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        A new donation has been completed and processed. See details below.
      </p>
      ${infoTable([
        ["Donor",     donorName],
        ["Email",     donorEmail],
        ["Amount",    `<strong style="font-size:18px;color:${t.pink};">₦${Number(amount).toLocaleString("en-NG")}</strong>`],
        ["Reference", `<code style="font-family:'Courier New',monospace;background:${t.surfaceBg};padding:2px 8px;border-radius:4px;font-size:13px;">${reference}</code>`],
        ["Date",      donationDate || new Date().toLocaleDateString("en-NG", { dateStyle: "long" })],
      ], t.pink)}
      ${signoff()}
    `,
  });

exports.verificationRequestNotificationEmail = (organizerName, organizerEmail, verificationId, documentCount, reviewLink) =>
  baseLayout({
    banner: banners.verificationRequest(),
    content: `
      ${greeting("TickiSpot Team")}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        An organizer has submitted documents for verification. Review and complete the approval workflow.
      </p>
      ${infoTable([
        ["Organizer",   `${organizerName} &lt;${organizerEmail}&gt;`],
        ["Request ID",  `<code style="font-family:'Courier New',monospace;background:${t.surfaceBg};padding:2px 8px;border-radius:4px;font-size:13px;">${verificationId}</code>`],
        ["Documents",   `${documentCount} file${documentCount !== 1 ? "s" : ""} uploaded`],
        ["Submitted",   new Date().toLocaleDateString("en-NG", { dateStyle: "long" })],
      ], t.blue)}
      ${ctaButton(reviewLink, "Review verification", t.blue)}
      ${signoff()}
    `,
  });

exports.verificationApprovedEmail = (name, dashboardLink) =>
  baseLayout({
    banner: banners.verificationApproved(),
    content: `
      ${greeting(name)}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        Your organizer verification has been approved. You now carry verified status on TickiSpot and have access to all organizer features.
      </p>
      ${infoTable([
        ["Status",    pill("Verified", t.green, t.greenBg)],
        ["Next step", "Head to your dashboard to create or manage events"],
      ], t.green)}
      ${ctaButton(dashboardLink, "Go to my dashboard", t.green)}
      ${signoff()}
    `,
  });

exports.verificationRejectedEmail = (name, reason, resubmitLink) =>
  baseLayout({
    banner: banners.verificationRejected(),
    content: `
      ${greeting(name)}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        Your organizer verification request could not be approved at this time.
      </p>
      ${alertBox(`<strong>Reason:</strong> ${reason || "Insufficient documentation provided."}`, t.red, t.redBg, t.redBorder)}
      ${infoTable([
        ["Status",  pill("Declined", t.red, t.redBg)],
        ["Action",  "Update your documents and resubmit"],
      ], t.red)}
      ${ctaButton(resubmitLink, "Review my verification", t.red)}
      ${signoff()}
    `,
  });

exports.verificationResubmissionRequestEmail = (name, instructions, resubmitLink) =>
  baseLayout({
    banner: banners.verificationRejected(),
    content: `
      ${greeting(name)}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        We reviewed your verification documents. Please resubmit with the following corrections to continue.
      </p>
      ${alertBox(`<strong>Instructions:</strong><br/><span style="white-space:pre-wrap;">${instructions}</span>`, t.amber, t.amberBg, t.amberBorder)}
      ${infoTable([
        ["Status", pill("Resubmission required", t.amber, t.amberBg)],
      ], t.amber)}
      ${ctaButton(resubmitLink, "Resubmit verification", t.amber)}
      ${signoff()}
    `,
  });

exports.verificationSuspendedEmail = (name, reason, dashboardLink) =>
  baseLayout({
    banner: banners.verificationRejected(),
    content: `
      ${greeting(name)}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        Your organizer verification has been temporarily placed under review as part of our standard platform integrity process.
      </p>
      ${alertBox(`<strong>Reason:</strong> ${reason}`, t.red, t.redBg, t.redBorder)}
      ${infoTable([
        ["Status",    pill("Under review", t.red, t.redBg)],
        ["Next step", "Our team will contact you once the review is complete"],
      ], t.red)}
      ${ctaButton(dashboardLink, "Check verification status", t.red)}
      <p style="margin:20px 0 0;font-size:13px;color:${t.subtle};line-height:1.6;">
        If you have questions, reach us at
        <a href="mailto:support@tickispot.com" style="color:${t.pink};">support@tickispot.com</a>.
      </p>
      ${signoff()}
    `,
  });

exports.welcomeSuccessEmail = (name) =>
  baseLayout({
    banner: banners.welcomeSuccess(),
    content: `
      ${greeting(name)}
      <p style="margin:0 0 24px;font-size:15px;color:${t.muted};line-height:1.75;">
        Your account is fully verified. Here's what you can do on TickiSpot:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${t.border};border-radius:8px;overflow:hidden;">
        ${[
          ["Create events",      "Build and publish events in minutes"],
          ["Host live streams",  "Broadcast to audiences across Africa"],
          ["Sell tickets",       "Accept payments and track revenue in real time"],
          ["View analytics",     "Monitor attendance, sales, and audience insights"],
        ].map(([title, desc], i) => `
          <tr>
            <td style="padding:14px 16px;${i > 0 ? `border-top:1px solid ${t.border};` : ""}">
              <strong style="font-size:14px;color:${t.text};display:block;">${title}</strong>
              <span style="font-size:13px;color:${t.muted};">${desc}</span>
            </td>
          </tr>`).join("")}
      </table>
      ${ctaButton(`${BASE_URL}/dashboard`, "Go to my dashboard")}
      ${signoff()}
    `,
  });

exports.ticketPurchaseEmail = (name, eventTitle, quantity) =>
  baseLayout({
    banner: banners.ticketPurchase(),
    content: `
      ${greeting(name)}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        Your booking is confirmed. Present the QR code below at the venue entrance.
      </p>
      ${infoTable([
        ["Event",   `<strong>${eventTitle}</strong>`],
        ["Tickets", `${quantity} × General Admission`],
        ["Status",  pill("Confirmed", t.purple, t.purpleBg)],
        ["Entry",   "Show QR code at the gate"],
      ], t.purple)}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td style="text-align:center;background:${t.purpleBg};border:1px solid ${t.purpleBorder};border-radius:8px;padding:28px;">
            <p style="margin:0 0 16px;font-size:11px;font-weight:600;color:${t.purple};text-transform:uppercase;letter-spacing:0.8px;">Entry QR Code</p>
            <img src="cid:ticketqr" width="148" height="148"
                 style="display:block;margin:0 auto;border-radius:8px;"
                 alt="Ticket QR Code"/>
            <p style="margin:14px 0 0;font-size:12px;color:${t.subtle};">Scan at venue entry · Do not share publicly</p>
          </td>
        </tr>
      </table>
      ${signoff()}
    `,
    footerNote: "Keep this email safe. Your QR code is unique to your ticket and cannot be transferred or reused.",
  });

exports.organizerTicketAlertEmail = (organizerName, eventTitle, buyerName, quantity) =>
  baseLayout({
    banner: banners.organizerAlert(),
    content: `
      ${greeting(organizerName)}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        A new ticket purchase has been completed for one of your events.
      </p>
      ${infoTable([
        ["Event",  `<strong>${eventTitle}</strong>`],
        ["Buyer",  buyerName],
        ["Sold",   `${quantity} ticket${quantity > 1 ? "s" : ""}`],
        ["Time",   new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })],
      ], t.blue)}
      ${ctaButton(`${BASE_URL}/dashboard/events`, "View event dashboard", t.blue)}
      ${signoff()}
    `,
    footerNote: "This is an automated notification. Visit your organizer dashboard for full sales reporting and attendee management.",
  });

exports.billingSuccessEmail = (name, plan, amount, interval, reference, activationDate, expirationDate) =>
  baseLayout({
    banner: banners.billingSuccess(),
    content: `
      ${greeting(name)}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        Your <strong>${plan.toUpperCase()}</strong> subscription is now active. You have full access to all premium features.
      </p>
      ${infoTable([
        ["Plan",          pill(plan.toUpperCase(), t.green, t.greenBg)],
        ["Billing cycle", interval.charAt(0).toUpperCase() + interval.slice(1)],
        ["Amount",        `<strong style="font-size:18px;color:${t.green};">₦${Number(amount).toLocaleString("en-NG")}</strong>`],
        ["Reference",     `<code style="font-family:'Courier New',monospace;background:${t.surfaceBg};padding:2px 8px;border-radius:4px;font-size:13px;">${reference}</code>`],
        ["Activated",     activationDate || new Date().toLocaleDateString("en-NG", { dateStyle: "long" })],
        ["Renews",        expirationDate || new Date().toLocaleDateString("en-NG", { dateStyle: "long" })],
        ["Status",        pill("Active", t.green, t.greenBg)],
      ], t.green)}
      ${ctaButton(`${BASE_URL}/dashboard`, "Go to my dashboard", t.green)}
      ${signoff()}
    `,
    footerNote: "Save this email as your payment receipt. Manage your subscription anytime from your billing settings.",
  });

exports.subscriptionAdminNotificationEmail = (userName, userEmail, plan, amount, interval, reference, transactionDate) =>
  baseLayout({
    banner: banners.billingSuccess(),
    content: `
      ${greeting("TickiSpot Team")}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        A user has completed a subscription payment. Details are below.
      </p>
      ${infoTable([
        ["Subscriber", userName],
        ["Email",      userEmail],
        ["Plan",       pill(plan.toUpperCase(), t.green, t.greenBg)],
        ["Interval",   interval.charAt(0).toUpperCase() + interval.slice(1)],
        ["Amount",     `<strong style="font-size:18px;color:${t.green};">₦${Number(amount).toLocaleString("en-NG")}</strong>`],
        ["Reference",  `<code style="font-family:'Courier New',monospace;background:${t.surfaceBg};padding:2px 8px;border-radius:4px;font-size:13px;">${reference}</code>`],
        ["Date",       transactionDate || new Date().toLocaleDateString("en-NG", { dateStyle: "long" })],
      ], t.green)}
      ${signoff()}
    `,
    footerNote: "Internal notification for TickiSpot finance and support teams.",
  });

exports.teamInvitationEmail = (name, eventTitle, role, acceptUrl) =>
  baseLayout({
    banner: banners.teamInvitation(),
    content: `
      ${greeting(name)}
      <p style="margin:0 0 20px;font-size:15px;color:${t.muted};line-height:1.75;">
        An event organizer on TickiSpot has invited you to collaborate on an upcoming event. Review the details and accept to get started.
      </p>
      ${infoTable([
        ["Event",    `<strong>${eventTitle}</strong>`],
        ["Your role", pill(role.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase()), t.pink, "#FDF2F8")],
        ["Platform", "TickiSpot"],
        ["Expires",  "In 7 days"],
      ], t.pink)}
      ${ctaButton(acceptUrl, "Accept invitation")}
      <p style="margin:16px 0 0;font-size:13px;color:${t.subtle};text-align:center;">
        Not interested?
        <a href="${BASE_URL}/invitations/decline" style="color:${t.muted};text-decoration:underline;">Decline this invitation</a>
      </p>
      ${signoff()}
    `,
    footerNote: "This invitation expires in 7 days. You can accept or decline from your TickiSpot account at any time.",
  });