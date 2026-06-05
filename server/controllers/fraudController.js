const fraudService = require('../services/fraudService');

exports.getAdminSummary = async (req, res) => {
  try {
    const summary = await fraudService.getFraudSummary(30);
    return res.json({ success: true, summary });
  } catch (error) {
    console.error('fraud summary error', error);
    return res.status(500).json({ message: 'Failed to fetch fraud summary' });
  }
};

exports.getOrganizerFlags = async (req, res) => {
  try {
    const organizerId = req.params.organizerId;
    const flags = await fraudService.getFlagsForOrganizer(organizerId);
    return res.json({ success: true, flags });
  } catch (error) {
    console.error('get organizer flags error', error);
    return res.status(500).json({ message: 'Failed to fetch flags' });
  }
};

exports.clearFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const cleared = await fraudService.clearFlag(id, req.user?._id);
    return res.json({ success: true, flag: cleared });
  } catch (error) {
    console.error('clear flag error', error);
    return res.status(500).json({ message: 'Failed to clear flag' });
  }
};
