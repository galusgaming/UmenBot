const { Schema, model } = require('mongoose');

const economySettingsSchema = new Schema(
  {
    guildID: { type: String, required: true, unique: true, index: true },
    currencyName: { type: String, default: 'monety' },
    currencySymbol: { type: String, default: '🪙' },
    startingBalance: { type: Number, default: 100, min: 0 },
    dailyAmount: { type: Number, default: 200, min: 0 },
    workMin: { type: Number, default: 50, min: 0 },
    workMax: { type: Number, default: 250, min: 0 },
    workCooldownMinutes: { type: Number, default: 60, min: 1 },
    robEnabled: { type: Boolean, default: true },
    robSuccessChance: { type: Number, default: 40, min: 0, max: 100 },
    robMaxPercent: { type: Number, default: 30, min: 1, max: 100 },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

module.exports = model('economysettings', economySettingsSchema);
