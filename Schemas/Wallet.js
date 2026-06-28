const { Schema, model } = require('mongoose');

const walletSchema = new Schema({
  guildID: { type: String, required: true },
  userID: { type: String, required: true },
  balance: { type: Number, default: 0 },
  lastDaily: { type: Date },
  lastWork: { type: Date },
  inventory: { type: Array, default: [] },
});

walletSchema.index({ guildID: 1, userID: 1 }, { unique: true });

module.exports = model('wallet', walletSchema);
