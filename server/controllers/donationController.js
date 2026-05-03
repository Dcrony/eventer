const axios = require("axios");
const { donationSuccessEmail } = require("../utils/emailTemplates");
const { sendEmail } = require("../utils/email");
const Donation = require("../models/Donation");


const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;


exports.initiateDonation = async (req, res) => {
  const { name, email, amount, message } = req.body;

  if (!name || !email || !amount) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const reference = `don_${Date.now()}`;

    // ✅ SAVE as pending FIRST
    await Donation.create({
      name,
      email,
      amount,
      message,
      reference,
      status: "pending",
    });

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Math.round(amount * 100),
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
    return res.redirect(`${FRONTEND_URL}/donate?status=failed`);
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
      // ✅ UPDATE DB
      if (donation) {
        donation.status = "success";
        await donation.save();
      }

      const name = data.metadata?.name || "Supporter";
      const email = data.customer.email;
      const amount = data.amount / 100;

      // ✅ SEND EMAIL
      sendEmail({
        email,
        subject: "Thank you for your donation 💖",
        html: donationSuccessEmail(name, amount, ref),
      }).catch(console.error);

      return res.redirect(
        `${FRONTEND_URL}/donate?status=success&reference=${ref}`
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