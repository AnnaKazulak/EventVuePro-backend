const { Schema, model } = require("mongoose");

const eventSchema = new Schema(
  {
    title: { type: String, required: [true, "Event title is required"] },
    description: String,
    date: Date,
    time: String,
    location: String,
    imageUrl: { type: String, required: false },
    guests: [
      {
        type: Schema.Types.ObjectId,
        ref: "Guest",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = model("event", eventSchema);
