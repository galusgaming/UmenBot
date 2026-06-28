const Wallet = require('../Schemas/Wallet');

async function getWallet(guildID, userID) {
  // return wallet document or null
}

async function createWallet(guildID, userID) {
  // create initial wallet
}

async function addCoins(guildID, userID, amount) {
  // add amount to wallet
}

async function removeCoins(guildID, userID, amount) {
  // remove amount from wallet
}

module.exports = { getWallet, createWallet, addCoins, removeCoins };
