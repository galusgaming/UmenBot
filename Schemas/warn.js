const { Schema, model } = require("mongoose");
const warnSchema = new Schema({
  userID: {
    type: String,
    required: true,
  },
  guildID: {
    type: String,
    required: true,
  },
  warns: {
    type: Number,
    default: 0,
  },
});

// ensure unique per guild per user
warnSchema.index({ guildID: 1, userID: 1 }, { unique: true });

module.exports = model("userWarn", warnSchema);
