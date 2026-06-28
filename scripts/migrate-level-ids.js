const mongoose = require('mongoose');
const Level = require('../Schemas/level');
const config = require('../configs/config');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || config.DatabaseURL;
  if (!uri) {
    console.error('No MongoDB URI found. Set MONGODB_URI or configure configs/config.js');
    process.exit(1);
  }
  await mongoose.connect(uri, {});
  console.log('Connected to MongoDB');

  const backupName = `level_backup_${Date.now()}`;
  console.log('Creating backup collection:', backupName);
  const db = mongoose.connection.db;
  await db.collection('levels').aggregate([{ $match: {} }, { $out: backupName }]).toArray().catch(()=>{});

  console.log('Reading all level documents...');
  const docs = await Level.find().lean();

  const map = new Map();
  for (const d of docs) {
    const guildID = String(d.guildID);
    const userID = String(d.userID);
    const key = `${guildID}:${userID}`;
    if (!map.has(key)) {
      map.set(key, { ...d, guildID, userID, _ids: [d._id] });
    } else {
      const existing = map.get(key);
      existing.xp = (existing.xp || 0) + (d.xp || 0);
      existing.level = Math.max(existing.level || 0, d.level || 0);
      existing._ids.push(d._id);
      map.set(key, existing);
    }
  }

  console.log('Merging duplicates and normalizing types...');
  for (const [key, item] of map.entries()) {
    const ids = item._ids.map(String);
    const keepId = ids.shift(); // first id to keep
    // update the kept document
    await Level.updateOne({ _id: keepId }, { $set: { guildID: item.guildID, userID: item.userID, xp: item.xp, level: item.level } }).catch(err => console.error('updateOne err', err));
    // remove any other duplicate docs
    if (ids.length) {
      await Level.deleteMany({ _id: { $in: ids } }).catch(err => console.error('deleteMany err', err));
    }
  }

  console.log('Ensuring compound unique index on {guildID, userID}');
  try {
    await Level.collection.createIndex({ guildID: 1, userID: 1 }, { unique: true });
    console.log('Index created (or already exists)');
  } catch (e) {
    console.error('Failed to create index:', e.message);
  }

  console.log('Migration complete. Backup collection:', backupName);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
