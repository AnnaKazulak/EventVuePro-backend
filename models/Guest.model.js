const {
  Schema,
  model
} = require("mongoose");

const guestSchema = new Schema({
  name: {
    type: String,
    required: [true, "Guest name is required"]
  },
  email: {
    type: String,
    required: [true, "Guest Email adress is required"]
  },
  whatsappNumber: String,
  description: String,
  imageUrl: {
    type: String,
    required: false
  },
  imageWidth: Number,
  imageHeight: Number,
  event: {
    type: Schema.Types.ObjectId,
    ref: "Event"
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
}, {
  timestamps: true,
});

module.exports = model("Guest", guestSchema);