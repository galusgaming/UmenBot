const { Schema, model } = require('mongoose');

const inventoryItemSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  roleID: { type: String, default: null },
  purchasedAt: { type: Date, default: Date.now },
});

const walletSchema = new Schema({
  guildID: { type: String, required: true },
  userID: { type: String, required: true },
  balance: { type: Number, default: 0 },
  lastDaily: { type: Date },
  lastWork: { type: Date },
  lastRob: { type: Date },
  inventory: { type: [inventoryItemSchema], default: [] },
});

walletSchema.index({ guildID: 1, userID: 1 }, { unique: true });

module.exports = model('wallet', walletSchema);
