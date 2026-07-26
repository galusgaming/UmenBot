const { Schema, model } = require('mongoose')

const panelAuditSchema = new Schema({
  guildID: { type: String, required: true, index: true },
  actorId: { type: String, default: null },
  actorName: { type: String, default: null },
  action: { type: String, required: true },
  targetType: { type: String, default: null },
  targetId: { type: String, default: null },
  details: { type: Object, default: {} },
}, { timestamps: true })

module.exports = model('PanelAudit', panelAuditSchema)