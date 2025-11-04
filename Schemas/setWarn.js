const { Schema, model } = require("mongoose");
const warnSchema = new Schema({
  warns: {
    type: Number,
    required: true,
  },
  guildID: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    default: "none",
  },
  // optional extra info, for example timeout duration like '1h' or '30m'
  meta: {
    type: String,
    default: null,
  },
});

// ensure unique per guild per warn count
warnSchema.index({ guildID: 1, warns: 1 }, { unique: true });

// Export as a distinct model name to avoid collision with user warn model
module.exports = model("warnRule", warnSchema);
