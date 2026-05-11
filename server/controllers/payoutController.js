const PayoutAccount = require("../models/PayoutAccount");
const User = require("../models/User");
const { createRecipient } = require("../utils/paystack");
const { createNotification } = require("../services/notificationService");

const connectPayoutAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, bankCode } = req.body;
    const organizerId = req.user.id;

    // Validate required fields
    if (!bankName || !accountNumber || !accountName || !bankCode) {
      return res.status(400).json({
        message: "All bank details are required"
      });
    }

    // Check if organizer already has a payout account
    const existingAccount = await PayoutAccount.findOne({ organizer: organizerId });
    if (existingAccount) {
      return res.status(400).json({
        message: "Payout account already connected. Use update endpoint to change details."
      });
    }

    // Create Paystack recipient
    const recipientCode = await createRecipient({
      bankName,
      accountNumber,
      accountName,
      bankCode,
    });

    // Create payout account record
    const payoutAccount = await PayoutAccount.create({
      organizer: organizerId,
      paystackRecipientCode: recipientCode,
      bankDetails: {
        bankName,
        accountNumber,
        accountName,
        bankCode,
      },
      isVerified: true, // Assume verified for now, could add verification step later
      status: "active",
      lastVerifiedAt: new Date(),
    });

    // Update user with payout account reference
    await User.findByIdAndUpdate(organizerId, {
      payoutAccount: payoutAccount._id
    });

    // Send notification
    await createNotification(req.app, {
      userId: organizerId,
      type: "payout_account_connected",
      message: "Your payout account has been successfully connected",
      actionUrl: "/earnings",
    });

    res.status(201).json({
      message: "Payout account connected successfully",
      payoutAccount: {
        id: payoutAccount._id,
        bankName: payoutAccount.bankDetails.bankName,
        accountNumber: `****${payoutAccount.bankDetails.accountNumber.slice(-4)}`,
        accountName: payoutAccount.bankDetails.accountName,
        status: payoutAccount.status,
        connectedAt: payoutAccount.createdAt,
      }
    });

  } catch (error) {
    console.error("Connect payout account error:", error);
    res.status(500).json({
      message: "Failed to connect payout account",
      error: error.message
    });
  }
};

const getPayoutAccount = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const payoutAccount = await PayoutAccount.findOne({ organizer: organizerId });

    if (!payoutAccount) {
      return res.status(404).json({
        message: "No payout account connected"
      });
    }

    res.json({
      id: payoutAccount._id,
      bankName: payoutAccount.bankDetails.bankName,
      accountNumber: `****${payoutAccount.bankDetails.accountNumber.slice(-4)}`,
      accountName: payoutAccount.bankDetails.accountName,
      status: payoutAccount.status,
      connectedAt: payoutAccount.createdAt,
      isVerified: payoutAccount.isVerified,
    });

  } catch (error) {
    console.error("Get payout account error:", error);
    res.status(500).json({
      message: "Failed to retrieve payout account"
    });
  }
};

const updatePayoutAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, bankCode } = req.body;
    const organizerId = req.user.id;

    // Validate required fields
    if (!bankName || !accountNumber || !accountName || !bankCode) {
      return res.status(400).json({
        message: "All bank details are required"
      });
    }

    const payoutAccount = await PayoutAccount.findOne({ organizer: organizerId });
    if (!payoutAccount) {
      return res.status(404).json({
        message: "No payout account found. Please connect an account first."
      });
    }

    // Create new Paystack recipient with updated details
    const recipientCode = await createRecipient({
      bankName,
      accountNumber,
      accountName,
      bankCode,
    });

    // Update payout account
    payoutAccount.paystackRecipientCode = recipientCode;
    payoutAccount.bankDetails = {
      bankName,
      accountNumber,
      accountName,
      bankCode,
    };
    payoutAccount.isVerified = true;
    payoutAccount.lastVerifiedAt = new Date();
    payoutAccount.verificationAttempts = 0;
    payoutAccount.failureReason = null;

    await payoutAccount.save();

    // Send notification
    await createNotification(req.app, {
      userId: organizerId,
      type: "payout_account_updated",
      message: "Your payout account has been successfully updated",
      actionUrl: "/earnings",
    });

    res.json({
      message: "Payout account updated successfully",
      payoutAccount: {
        id: payoutAccount._id,
        bankName: payoutAccount.bankDetails.bankName,
        accountNumber: `****${payoutAccount.bankDetails.accountNumber.slice(-4)}`,
        accountName: payoutAccount.bankDetails.accountName,
        status: payoutAccount.status,
        updatedAt: payoutAccount.updatedAt,
      }
    });

  } catch (error) {
    console.error("Update payout account error:", error);
    res.status(500).json({
      message: "Failed to update payout account",
      error: error.message
    });
  }
};

const disconnectPayoutAccount = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const payoutAccount = await PayoutAccount.findOne({ organizer: organizerId });
    if (!payoutAccount) {
      return res.status(404).json({
        message: "No payout account found"
      });
    }

    // Check for pending withdrawals
    const Withdrawal = require("../models/Withdrawal");
    const pendingWithdrawals = await Withdrawal.findOne({
      organizer: organizerId,
      status: { $in: ["pending", "approved", "processing"] }
    });

    if (pendingWithdrawals) {
      return res.status(400).json({
        message: "Cannot disconnect payout account with pending withdrawals. Please wait for completion or contact support."
      });
    }

    // Remove payout account
    await PayoutAccount.findByIdAndDelete(payoutAccount._id);

    // Update user
    await User.findByIdAndUpdate(organizerId, {
      payoutAccount: null
    });

    // Send notification
    await createNotification(req.app, {
      userId: organizerId,
      type: "payout_account_disconnected",
      message: "Your payout account has been disconnected",
      actionUrl: "/earnings",
    });

    res.json({
      message: "Payout account disconnected successfully"
    });

  } catch (error) {
    console.error("Disconnect payout account error:", error);
    res.status(500).json({
      message: "Failed to disconnect payout account"
    });
  }
};

module.exports = {
  connectPayoutAccount,
  getPayoutAccount,
  updatePayoutAccount,
  disconnectPayoutAccount,
};