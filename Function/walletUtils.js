const Wallet = require('../Schemas/Wallet');
const EconomySettings = require('../Schemas/EconomySettings');

async function getWallet(guildID, userID) {
  return Wallet.findOne({ guildID: String(guildID), userID: String(userID) });
}

async function createWallet(guildID, userID) {
  const settings = await getEconomySettings(guildID);
  try {
    return await Wallet.create({
      guildID: String(guildID),
      userID: String(userID),
      balance: settings.startingBalance || 0,
      inventory: [],
    });
  } catch (err) {
    if (err?.code === 11000) {
      return Wallet.findOne({ guildID: String(guildID), userID: String(userID) });
    }
    throw err;
  }
}

async function getOrCreateWallet(guildID, userID) {
  let wallet = await getWallet(guildID, userID);
  if (!wallet) wallet = await createWallet(guildID, userID);
  return wallet;
}

async function addCoins(guildID, userID, amount) {
  const amt = Math.trunc(Number(amount) || 0);
  await getOrCreateWallet(guildID, userID);
  return Wallet.findOneAndUpdate(
    { guildID: String(guildID), userID: String(userID) },
    { $inc: { balance: amt } },
    { new: true, upsert: true }
  );
}

async function removeCoins(guildID, userID, amount) {
  const amt = Math.trunc(Number(amount) || 0);
  const wallet = await getOrCreateWallet(guildID, userID);
  if (wallet.balance < amt) return null;
  return Wallet.findOneAndUpdate(
    { guildID: String(guildID), userID: String(userID), balance: { $gte: amt } },
    { $inc: { balance: -amt } },
    { new: true }
  );
}

async function getEconomySettings(guildID) {
  const settings = await EconomySettings.findOne({ guildID: String(guildID) }).lean();
  return (
    settings || {
      guildID: String(guildID),
      currencyName: 'monety',
      currencySymbol: '🪙',
      startingBalance: 100,
      dailyAmount: 200,
      workMin: 50,
      workMax: 250,
      workCooldownMinutes: 60,
      robEnabled: true,
      robSuccessChance: 40,
      robMaxPercent: 30,
    }
  );
}

module.exports = {
  getWallet,
  createWallet,
  getOrCreateWallet,
  addCoins,
  removeCoins,
  getEconomySettings,
};
