const Ticket = require("../models/Ticket");

exports.getMyTickets = async (req, res) => {
  try {
    console.log("Decoded user in getMyTickets:", req.user); // debug

    const tickets = await Ticket.find({ buyer: req.user.id })
      .populate({
        path: "event",
        populate: {
          path: "createdBy",
          select: "username profilePic",
        },
      });

    if (!tickets || tickets.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(tickets);
  } catch (err) {
    console.error("Error fetching user tickets:", err);
    res.status(500).json({ message: "Server error" });
  }
};
