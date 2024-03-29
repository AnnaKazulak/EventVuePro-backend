const {
  Schema,
  model
} = require("mongoose");

const eventSchema = new Schema({
  title: {
    type: String,
    required: [true, "Event title is required"]
  },
  description: String,
  date: Date,
  time: String,
  location: String,
  imageUrl: {
    type: String,
    required: false
  },
  gallery: [{
    galleryImageUrl: {
      type: String,
      required: false,
    },
    imageWidth: Number,
    imageHeight: Number,
  }, ],
  guests: [{
    type: Schema.Types.ObjectId,
    ref: "Guest",
  }, ],
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
}, {
  timestamps: true,
});

module.exports = model("event", eventSchema);