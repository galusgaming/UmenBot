const { Schema, model } = require('mongoose');

const shopItemSchema = new Schema({
  guildID: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String },
  roleID: { type: String },
  description: { type: String },
});

shopItemSchema.index({ guildID: 1, name: 1 }, { unique: true });

module.exports = model('shopitem', shopItemSchema);
