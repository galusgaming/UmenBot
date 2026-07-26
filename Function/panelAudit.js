const PanelAudit = require('../Schemas/PanelAudit')

async function recordPanelAudit(entry) {
  if (!entry?.guildID || !entry?.action) return null

  try {
    return await PanelAudit.create({
      guildID: String(entry.guildID),
      actorId: entry.actorId ? String(entry.actorId) : null,
      actorName: entry.actorName ? String(entry.actorName) : null,
      action: String(entry.action),
      targetType: entry.targetType ? String(entry.targetType) : null,
      targetId: entry.targetId ? String(entry.targetId) : null,
      details: entry.details || {},
    })
  } catch (err) {
    console.error('Error writing panel audit log', err)
    return null
  }
}

module.exports = { recordPanelAudit }