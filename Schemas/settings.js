const { Schema, model } = require("mongoose");

const roleRewardSchema = new Schema(
  {
    level: { type: Number, required: true, min: 0 },
    roleId: { type: String, required: true },
  },
  { _id: false }
);

const blacklistSchema = new Schema(
  {
    channels: { type: [String], default: [] },
    users: { type: [String], default: [] },
    roles: { type: [String], default: [] },
  },
  { _id: false }
);

const settingsSchema = new Schema(
  {
    guildID: { type: String, required: true, unique: true, index: true },
    xpRate: { type: Number, default: 1, min: 0 },
    roleRewards: { type: [roleRewardSchema], default: [] },
    blacklist: { type: blacklistSchema, default: () => ({}) },
    updatedBy: { type: String }, // userId of last editor
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model("settings", settingsSchema);
