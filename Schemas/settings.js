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

const economySchema = new Schema(
  {
    currencyName: { type: String, default: "monety" },
    dailyReward: { type: Number, default: 100, min: 0 },
    dailyCooldownHours: { type: Number, default: 24, min: 0 },
    workMin: { type: Number, default: 50, min: 0 },
    workMax: { type: Number, default: 200, min: 0 },
    workCooldownHours: { type: Number, default: 1, min: 0 },
    robEnabled: { type: Boolean, default: true },
    robSuccessRate: { type: Number, default: 0.4, min: 0, max: 1 },
    robMinSteal: { type: Number, default: 10, min: 0 },
    robMaxStealPercent: { type: Number, default: 0.25, min: 0, max: 1 },
    robCooldownHours: { type: Number, default: 2, min: 0 },
    robFinePercent: { type: Number, default: 0.1, min: 0, max: 1 },
    gamblingMinBet: { type: Number, default: 10, min: 0 },
    gamblingMaxBet: { type: Number, default: 1000, min: 0 },
    transferMin: { type: Number, default: 1, min: 0 },
    sellRatio: { type: Number, default: 0.5, min: 0, max: 1 },
  },
  { _id: false }
);

const settingsSchema = new Schema(
  {
    guildID: { type: String, required: true, unique: true, index: true },
    xpRate: { type: Number, default: 1, min: 0 },
    roleRewards: { type: [roleRewardSchema], default: [] },
    blacklist: { type: blacklistSchema, default: () => ({}) },
    economy: { type: economySchema, default: () => ({}) },
    updatedBy: { type: String }, // userId of last editor
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model("settings", settingsSchema);
