const router = require("express").Router();
const cloudinary = require("cloudinary").v2;
const multer = require("../config/multer.config");
const fs = require('fs');

const mongoose = require("mongoose");
const Event = require("../models/Event.model");
const Guest = require("../models/Guest.model");



router.post("/upload", multer.array("imageUrl", 10), (req, res, next) => {
  try {
    const {
      imageType
    } = req.body;

    if (!imageType) {
      return res.status(400).json({
        error: "Image type not provided"
      });
    }

    if (imageType === "mainImage") {
      // Handle the main image upload
      const mainImage = req.files[0];
      const mainImageUrl = mainImage.path;
      console.log("mainImage", mainImage);


      // Additional processing if needed
      return res.json({
        fileUrl: mainImageUrl
      });
    } else if (imageType === "galleryImage") {
      // Handle the gallery images upload
      const galleryImages = req.files.map((file) => file.path);

      console.log("🌞 galleryImages", galleryImages);
      return res.json({
        fileUrl: galleryImages
      });
    } else {
      return res.status(400).json({
        error: "Invalid image type"
      });
    }

    const processedFiles = req.files.map((file) => ({
      fileUrl: file.path,
    }));

    return res.json(processedFiles);
  } catch (error) {
    console.error("Error in /upload route:", error);
    next(error); // Forward the error to the error handler middleware
  }
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
    await Event.updateOne({ imageUrl: imageUrl }, { $unset: { imageUrl: "" } });

    return res.json({
      message: "Image deleted successfully"
    });
  } catch (error) {
    console.error("Error in /images DELETE route:", error);
    next(error); // Forward the error to the error handler middleware
  }
});



//  POST /api/events  -  Creates a new event
router.post("/events", (req, res, next) => {
  const {
    title,
    description,
    date,
    time,
    location,
    imageUrl,
    gallery,
    guests
  } = req.body;

  const newEvent = {
    title,
    description,
    date,
    time,
    location,
    imageUrl,
    gallery,
    guests: guests,
  };

  Event.create(newEvent)
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

      console.log("Error creating new event...", err);
      res.status(500).json({
        message: "Error creating a new event",
        error: err,
      });
    });
});

// GET /api/events-  Retrieves all of the events
router.get("/events", (req, res, next) => {
  Event.find()
    .populate("guests")
    .then((allEvents) => res.json(allEvents))
    .catch((err) => {
      console.log("Error getting list of events...", err);
      res.status(500).json({
        message: "Error getting list of events",
        error: err,
      });
    });
});

//  GET /api/events/:eventId -  Retrieves a specific event by id
router.get("/events/:eventId", (req, res, next) => {
  const {
    eventId
  } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    res.status(400).json({
      message: "Specified id is not valid"
    });
    return;
  }

  Event.findById(eventId)
    .populate("guests")
    .then((event) => res.json(event))
    .catch((err) => {
      console.log("...", err);
      res.status(500).json({
        message: "Error getting event details",
        error: err,
      });
    });
});

// PUT /api/events/:eventId - Updates a specific event by id
router.put("/events/:eventId", (req, res, next) => {
  const {
    eventId
  } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    res.status(400).json({
      message: "Specified id is not valid"
    });
    return;
  }

  const {
    title,
    description,
    date,
    time,
    location,
    imageUrl,
    guests,
    gallery
  } = req.body;

  Event.findById(eventId)
    .then((event) => {
      if (!event) {
        return res.status(404).json({
          message: "Event not found"
        });
      }

      // Update the event fields
      event.title = title;
      event.description = description;
      event.date = date;
      event.time = time;
      event.location = location;
      event.imageUrl = imageUrl;
      event.guests = guests;
      event.gallery = gallery; // Update the gallery field

      // Save the updated event
      return event.save();
    })
    .then((updatedEvent) => res.json(updatedEvent))
    .catch((err) => {
      console.log("Error updating event", err);
      res.status(500).json({
        message: "Error updating event",
        error: err
      });
    });
});


// DELETE  /api/events/:eventId  -  Deletes a specific event by id
router.delete("/events/:eventId", (req, res, next) => {
  const {
    eventId
  } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    res.status(400).json({
      message: "Specified id is not valid"
    });
    return;
  }

  Event.findByIdAndRemove(eventId)
    .then(() =>
      res.json({
        message: `Event with ${eventId} is removed successfully.`,
      })
    )
    .catch((err) => {
      console.log("error deleting event", err);
      res.status(500).json({
        message: "error deleting event",
        error: err,
      });
    });
});

module.exports = router;