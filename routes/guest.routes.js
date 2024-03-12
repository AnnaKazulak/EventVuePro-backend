const router = require("express").Router();
const cloudinary = require("cloudinary").v2;
const multer = require("../config/multer.config");
const mongoose = require("mongoose");
const {
  isAuthenticated
} = require("../middleware/jwt.middleware");
const {
  checkOwnership
} = require("../middleware/authorization");

const Event = require("../models/Event.model");
const Guest = require("../models/Guest.model");

// Define a regex pattern for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST "/api/upload" => Route that receives the image, sends it to Cloudinary via the fileUploader and returns the image URL
router.post("/upload", multer.single("imageUrl"), (req, res, next) => {
  console.log("file is: ", req.file);

  if (!req.file) {
    next(new Error("No file uploaded!"));
    return;
  }

  // specify the URL of the image you want to get the dimensions of
  const imageUrl = req.file.path;

  // call the getImage method to get the dimensions of the image
  cloudinary.uploader.explicit(
    imageUrl, {
      type: "fetch"
    },
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

// Route handler for image deletion
router.delete("/images", async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        error: "Image URL not provided"
      });
    }

    // Extract public ID from Cloudinary URL
    const publicId = imageUrl.split('/').pop().split('.')[0];

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Update the Event document to remove the imageUrl
    await Guest.updateOne({ imageUrl: imageUrl }, { $unset: { imageUrl: "" } });

    return res.json({
      message: "Image deleted successfully"
    });
  } catch (error) {
    console.error("Error in /images DELETE route:", error);
    next(error); // Forward the error to the error handler middleware
  }
});

router.post("/guests", isAuthenticated, (req, res, next) => {
  const {
    name,
    email,
    whatsappNumber,
    description,
    imageUrl,
    eventId,
    imageWidth,
    imageHeight
  } = req.body;

  // Validate name and email fields
  if (!name) {
    return res.status(400).json({
      message: "Name and email are required fields"
    });
  }

    // Validate email format using regex
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

  const userId = req.payload._id;
  const newGuest = {
    name,
    email,
    whatsappNumber,
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
        $push: {
          guests: newGuest._id
        },
      });
    })
    .then((response) => res.json(response))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        // Mongoose validation error (e.g., required field missing)
        const validationErrors = Object.values(err.errors).map((error) => error.message);
        return res.status(400).json({
          message: 'Validation error',
          error: validationErrors,
        });
      }

      console.log("Error creating new guest...", err);
      res.status(500).json({
        message: "Error creating a new guest",
        error: err,
      });
    });
});


// GET /api/guests  Retrieves all of the guests
router.get("/guests", isAuthenticated, checkOwnership, (req, res, next) => {
  Guest.find({
      creator: req.payload._id
    })
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
  const {
    guestId
  } = req.params;

  if (!mongoose.Types.ObjectId.isValid(guestId)) {
    res.status(400).json({
      message: "Specified id is not valid"
    });
    return;
  }

  Guest.findById(guestId)
    .then((guest) => {
      if (!guest) {
        res.status(404).json({
          message: "Guest not found"
        });
      } else if (guest.creator.toString() !== req.payload._id) {
        res
          .status(403)
          .json({
            message: "You are not authorized to view this guest"
          });
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

router.put("/guests/:guestId", isAuthenticated, async (req, res, next) => {
  try {
    const {
      guestId
    } = req.params;
    const {
      name,
      email,
      whatsappNumber,
      description,
      imageUrl
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(guestId)) {
      return res.status(400).json({
        message: "Specified id is not valid"
      });
    }

    // Check if the user has permission to update the guest
    const guest = await Guest.findById(guestId);

    if (!guest) {
      return res.status(404).json({
        message: "Guest not found"
      });
    } else if (guest.creator.toString() !== req.payload._id) {
      return res
        .status(403)
        .json({
          message: "You are not authorized to update this guest"
        });
    }

    // If imageUrl is not provided (meaning no image is uploaded), update the guest details without modifying the imageUrl
    const newDetails = imageUrl ?
      {
        name,
        email,
        whatsappNumber,
        description,
        imageUrl
      } :
      {
        name,
        email,
        whatsappNumber,
        description
      };

    // Update the guest with the new details
    const updatedGuest = await Guest.findByIdAndUpdate(
      guestId,
      newDetails, {
        new: true
      }
    );

    res.json(updatedGuest);
  } catch (err) {
    console.error("Error updating guest...", err);
    res.status(500).json({
      message: "Error updating guest",
      error: err
    });
  }
});


// DELETE /guests/:guestId Delete a guest by their ID.

router.delete("/guests/:guestId", isAuthenticated, (req, res, next) => {
  const {
    guestId
  } = req.params;

  if (!mongoose.Types.ObjectId.isValid(guestId)) {
    res.status(400).json({
      message: "Specified id is not valid"
    });
    return;
  }

  // Check if the user has permission to delete the guest
  Guest.findById(guestId)
    .then((guest) => {
      if (!guest) {
        res.status(404).json({
          message: "Guest not found"
        });
      } else if (guest.creator.toString() !== req.payload._id) {
        res
          .status(403)
          .json({
            message: "You are not authorized to delete this guest"
          });
      } else {
        Guest.findByIdAndRemove(guestId)
          .then((deletedGuest) => {
            if (!deletedGuest) {
              res.status(404).json({
                message: "Guest not found"
              });
            } else {
              res.json({
                message: "Guest deleted successfully"
              });
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