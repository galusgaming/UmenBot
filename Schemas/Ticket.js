const { Schema, model } = require('mongoose');
 
const ticketSettingsSchema = new Schema({
  guildID:       { type: String, required: true, unique: true },
  staffRoleID:   { type: String, default: null },
  logsChannelID: { type: String, default: null },
  categoryID:    { type: String, default: null },
  ticketCount:   { type: Number, default: 0 },
});
 
module.exports = model('TicketSettings', ticketSettingsSchema);
 
