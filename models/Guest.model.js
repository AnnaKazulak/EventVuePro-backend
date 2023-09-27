const { Schema, model } = require("mongoose");

const guestSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    imageUrl: { type: String, required: false },
    imageWidth: Number,
    imageHeight: Number,
    event: { type: Schema.Types.ObjectId, ref: "Event" },
    
  },
  {
    timestamps: true,
  }
);

module.exports = model("Guest", guestSchema);
