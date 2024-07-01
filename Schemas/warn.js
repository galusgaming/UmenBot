const { Schema, model } = require("mongoose");
const warnSchema = new Schema({
  userID: {
    type: String,
    required: true,
    unique: true,
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

module.exports = model("warn", warnSchema);
