const Settings = require('../Schemas/settings');

const DEFAULT_ECONOMY = {
  currencyName: 'monety',
  dailyReward: 100,
  dailyCooldownHours: 24,
  workMin: 50,
  workMax: 200,
  workCooldownHours: 1,
  robEnabled: true,
  robSuccessRate: 0.4,
  robMinSteal: 10,
  robMaxStealPercent: 0.25,
  robCooldownHours: 2,
  robFinePercent: 0.1,
  gamblingMinBet: 10,
  gamblingMaxBet: 1000,
  transferMin: 1,
  sellRatio: 0.5,
};

async function getEconomySettings(guildID) {
  const doc = await Settings.findOne({ guildID: String(guildID) }).lean();
  return { ...DEFAULT_ECONOMY, ...(doc?.economy || {}) };
}

function formatCoins(amount, currencyName = 'monety') {
  const n = Math.floor(Number(amount) || 0);
  return `${n.toLocaleString('pl-PL')} ${currencyName}`;
}

function msUntilReady(lastDate, cooldownHours) {
  if (!lastDate) return 0;
  const elapsed = Date.now() - new Date(lastDate).getTime();
  const required = cooldownHours * 60 * 60 * 1000;
  return Math.max(0, required - elapsed);
}

function formatCooldown(ms) {
  if (ms <= 0) return null;
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!h && !m) parts.push(`${s}s`);
  return parts.join(' ');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const WORK_MESSAGES = [
  'dorobiłeś się jako kurier',
  'sprzątałeś serwer Discord',
  'moderowałeś kanał ogólny',
  'naprawiłeś bota',
  'sprzedałeś memy',
  'streamowałeś przez 2 godziny',
  'pomogłeś adminowi',
  'zrobiłeś grafikę dla serwera',
];

module.exports = {
  DEFAULT_ECONOMY,
  getEconomySettings,
  formatCoins,
  msUntilReady,
  formatCooldown,
  randomInt,
  WORK_MESSAGES,
};
