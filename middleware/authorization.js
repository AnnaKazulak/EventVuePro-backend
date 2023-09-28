const mongoose = require("mongoose");
const Guest = require("../models/Guest.model");

const checkOwnership = (req, res, next) => {
  if (!req.payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log(req.payload._id);
  Guest.find({ creator: req.payload._id })
    .populate("creator")
    .then((guest) => {
      console.log(guest);
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      next();
    })
    .catch((error) => {
      console.error("Error checking guest ownership:", error);
      res.status(500).json({
        message: "Error checking guest ownership",
        error: error,
      });
    });
};

module.exports = { checkOwnership };
