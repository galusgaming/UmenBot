const { Schema, model } = require("mongoose");
const levelSchema = new Schema({
  userID: {
    type: String,
    required: true,
  },
  guildID: {
    type: String,
    required: true,
  },
  xp: {
    type: Number,
    default: 0,
    min: 0,
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// Ensure one document per user per guild
levelSchema.index({ guildID: 1, userID: 1 }, { unique: true });

module.exports = model("level", levelSchema);
