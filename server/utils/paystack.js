const axios = require("axios");

const PAYSTACK_SECRET =
  process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET;
const BASE_URL = "https://api.paystack.co";

const headers = {
  Authorization: `Bearer ${PAYSTACK_SECRET}`,
  "Content-Type": "application/json",
};

// 1️⃣ Create Transfer Recipient
const createRecipient = async (bankDetails) => {
  const response = await axios.post(
    `${BASE_URL}/transferrecipient`,
    {
      type: "nuban",
      name: bankDetails.accountName,
      account_number: bankDetails.accountNumber,
      bank_code: bankDetails.bankCode,
      currency: "NGN",
    },
    { headers }
  );

  return response.data.data.recipient_code;
};

// 2️⃣ Initiate Transfer
const initiateTransfer = async (amount, recipientCode, reference) => {
  const response = await axios.post(
    `${BASE_URL}/transfer`,
    {
      source: "balance",
      amount,
      recipient: recipientCode,
      reference,
    },
    { headers }
  );

  return response.data.data;
};

// 3️⃣ Refund a Paystack transaction
const refundTransaction = async (reference, amount) => {
  if (!PAYSTACK_SECRET) {
    throw new Error("Paystack secret not configured");
  }
  if (!reference) {
    throw new Error("Missing payment reference for refund");
  }

  const payload = { transaction: reference };
  if (typeof amount === "number" && amount > 0) {
    payload.amount = Math.round(amount * 100);
  }

  const response = await axios.post(`${BASE_URL}/refund`, payload, { headers });
  return response.data.data;
};

module.exports = {
  createRecipient,
  initiateTransfer,
  refundTransaction,
};