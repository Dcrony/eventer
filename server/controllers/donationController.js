const axios = require("axios");
const { donationSuccessEmail } = require("../utils/emailTemplates");
const sendEmail = require("../utils/email");
const Donation = require("../models/Donation");


const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;
const MIN_DONATION_NAIRA = Number(process.env.MIN_DONATION_NAIRA) || 500;
const MAX_DONATION_NAIRA = Number(process.env.MAX_DONATION_NAIRA) || 5000000;

exports.initiateDonation = async (req, res) => {
  const { name, email, amount, message } = req.body;

  if (!name || !email || amount == null) {
    return res.status(400).json({ message: "All fields required" });
  }

  const donationAmount = Math.round(Number(amount));
  if (!Number.isFinite(donationAmount) || donationAmount < MIN_DONATION_NAIRA) {
    return res.status(400).json({
      message: `Minimum donation is ₦${MIN_DONATION_NAIRA.toLocaleString()}`,
    });
  }
  if (donationAmount > MAX_DONATION_NAIRA) {
    return res.status(400).json({ message: "Donation amount exceeds maximum allowed" });
  }

  try {
    const reference = `don_${Date.now()}`;

    await Donation.create({
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().toLowerCase().slice(0, 254),
      amount: donationAmount,
      message: message ? String(message).trim().slice(0, 500) : "",
      reference,
      status: "pending",
    });

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: donationAmount * 100,
        reference,
        callback_url: `${BACKEND_URL}/api/donations/verify`,
        metadata: { name, message },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    return res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
    });
  } catch (err) {
    console.error("INIT ERROR:", err.response?.data || err.message);
    return res.status(500).json({ message: "Failed to initiate donation" });
  }
};


exports.verifyDonation = async (req, res) => {
  const { reference, trxref } = req.query;
  const ref = reference || trxref;

  if (!ref) {
    return res.redirect(`${FRONTEND_URL}/donation?status=failed`);
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${ref}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const data = response.data.data;

    const donation = await Donation.findOne({ reference: ref });

    if (!donation) {
      console.error("Donation not found for ref:", ref);
    }

    if (data.status === "success") {
      if (donation) {
        const paidNaira = data.amount / 100;
        if (Math.abs(paidNaira - donation.amount) > 1) {
          console.error("Donation amount mismatch", { paid: paidNaira, expected: donation.amount });
          return res.redirect(`${FRONTEND_URL}/donation?status=failed`);
        }
        donation.status = "success";
        await donation.save();
      }

      const name = data.metadata?.name || donation?.name || "Supporter";
      const email = data.customer.email;
      const amount = donation?.amount ?? data.amount / 100;

      // ✅ SEND EMAIL
      sendEmail({
        email,
        subject: "Thank you for your donation 💖",
        html: donationSuccessEmail(name, amount, ref),
      }).catch(console.error);

      return res.redirect(
        `${FRONTEND_URL}/donation?status=success&reference=${ref}`
      );
    }

    // ❌ FAILED
    if (donation) {
      donation.status = "failed";
      await donation.save();
    }

    return res.redirect(`${FRONTEND_URL}/donate?status=failed`);
  } catch (err) {
    console.error("VERIFY ERROR:", err.response?.data || err.message);

    // mark failed
    await Donation.findOneAndUpdate(
      { reference: ref },
      { status: "failed" }
    );

    return res.redirect(`${FRONTEND_URL}/donate?status=failed`);
  }
};