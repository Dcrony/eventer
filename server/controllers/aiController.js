const { createAIResponse, generateEventFromPrompt } = require("../services/aiService");

const chatWithAI = async (req, res, next) => {
  try {
    const { role, message, context = {} } = req.body || {};

    if (!role || !["organizer", "user"].includes(role)) {
      return res.status(400).json({ message: "role must be organizer or user." });
    }

    const trimmedMessage = String(message || "").trim();
    if (!trimmedMessage) {
      return res.status(400).json({ message: "message is required." });
    }

    if (trimmedMessage.length > 1500) {
      return res.status(400).json({ message: "message must be 1500 characters or fewer." });
    }

    const aiResponse = await createAIResponse({ role, message: trimmedMessage, context });
    return res.json(aiResponse);
  } catch (error) {
    return next(error);
  }
};

const generateEvent = async (req, res, next) => {
  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ message: "prompt is required." });
    }

    const result = await generateEventFromPrompt({ prompt });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = { chatWithAI, generateEvent };
