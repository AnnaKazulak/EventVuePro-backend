const router = require("express").Router();
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { checkOwnership } = require("../middleware/authorization");

const Event = require("../models/Event.model");
const Guest = require("../models/Guest.model");
const fileUploader = require("../config/cloudinary.config");

// POST "/api/upload" => Route that receives the image, sends it to Cloudinary via the fileUploader and returns the image URL
router.post("/upload", fileUploader.single("imageUrl"), (req, res, next) => {
  console.log("file is: ", req.file);

  if (!req.file) {
    next(new Error("No file uploaded!"));
    return;
  }

  // specify the URL of the image you want to get the dimensions of
  const imageUrl = req.file.path;

  // call the getImage method to get the dimensions of the image
  cloudinary.uploader.explicit(
    imageUrl,
    { type: "fetch" },
    function (error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result.width, result.height);
        res.json({
          fileUrl: req.file.path,
          imageWidth: result.width,
          imageHeight: result.height,
        });
      }
    }
  );
});

router.post("/guests", isAuthenticated, (req, res, next) => {
  const { name, description, imageUrl, eventId, imageWidth, imageHeight } =
    req.body;
  console.log(req.body);

  const userId = req.payload._id;
  const newGuest = {
    name,
    description,
    imageUrl,
    imageHeight,
    imageWidth,
    event: eventId,
    creator: userId,
  };

  Guest.create(newGuest)
    .then((newGuest) => {
      return Event.findByIdAndUpdate(eventId, {
        $push: { guests: newGuest._id },
      });
    })
    .then((response) => res.json(response))
    .catch((err) => {
      console.log("Error creating new guest...", err);
      res.status(500).json({
        message: "Error creating a new guest",
        error: err,
      });
    });
});

// GET /api/guests  Retrieves all of the guests
router.get("/guests", isAuthenticated, checkOwnership, (req, res, next) => {
  Guest.find({ creator: req.payload._id })
    .then((guests) => res.json(guests))
    .catch((err) => {
      console.error("Error getting list of guests...", err);
      res.status(500).json({
        message: "Error getting list of guests",
        error: err,
      });
    });
});

//  GET /guests/:guestId  Retrieve details of a single guest by their ID.
router.get("/guests/:guestId", isAuthenticated, (req, res, next) => {
  const { guestId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(guestId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  Guest.findById(guestId)
    .then((guest) => {
      if (!guest) {
        res.status(404).json({ message: "Guest not found" });
      } else if (guest.creator.toString() !== req.payload._id) {
        res
          .status(403)
          .json({ message: "You are not authorized to view this guest" });
      } else {
        res.json(guest);
      }
    })
    .catch((err) => {
      console.error("Error getting guest details...", err);
      res.status(500).json({
        message: "Error getting guest details",
        error: err,
      });
    });
});

router.put("/guests/:guestId", isAuthenticated, (req, res, next) => {
  const { guestId } = req.params;
  const { name, description, imageUrl } = req.body;

  if (!mongoose.Types.ObjectId.isValid(guestId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  // Check if the user has permission to update the guest
  Guest.findById(guestId)
    .then((guest) => {
      if (!guest) {
        res.status(404).json({ message: "Guest not found" });
      } else if (guest.creator.toString() !== req.payload._id) {
        res
          .status(403)
          .json({ message: "You are not authorized to update this guest" });
      } else {
        const newDetails = { name, description, imageUrl };

        Guest.findByIdAndUpdate(guestId, newDetails, { new: true })
          .then((updatedGuest) => {
            if (!updatedGuest) {
              res.status(404).json({ message: "Guest not found" });
            } else {
              res.json(updatedGuest);
            }
          })
          .catch((err) => {
            console.error("Error updating guest...", err);
            res.status(500).json({
              message: "Error updating guest",
              error: err,
            });
          });
      }
    })
    .catch((err) => {
      console.error("Error getting guest details...", err);
      res.status(500).json({
        message: "Error getting guest details",
        error: err,
      });
    });
});

// DELETE /guests/:guestId Delete a guest by their ID.
router.delete("/guests/:guestId", isAuthenticated, (req, res, next) => {
  const { guestId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(guestId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }

  // Check if the user has permission to delete the guest
  Guest.findById(guestId)
    .then((guest) => {
      if (!guest) {
        res.status(404).json({ message: "Guest not found" });
      } else if (guest.creator.toString() !== req.payload._id) {
        res
          .status(403)
          .json({ message: "You are not authorized to delete this guest" });
      } else {
        Guest.findByIdAndRemove(guestId)
          .then((deletedGuest) => {
            if (!deletedGuest) {
              res.status(404).json({ message: "Guest not found" });
            } else {
              res.json({ message: "Guest deleted successfully" });
            }
          })
          .catch((err) => {
            console.error("Error deleting guest...", err);
            res.status(500).json({
              message: "Error deleting guest",
              error: err,
            });
          });
      }
    })
    .catch((err) => {
      console.error("Error getting guest details...", err);
      res.status(500).json({
        message: "Error getting guest details",
        error: err,
      });
    });
});

module.exports = router;
