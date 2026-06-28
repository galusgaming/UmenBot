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
  },
  level: {
    type: Number,
    default: 0,
  },
});

// Unikalny indeks na kombinację guildID + userID, pozwala na oddzielne profile per serwer
levelSchema.index({ guildID: 1, userID: 1 }, { unique: true });

module.exports = model("level", levelSchema);
