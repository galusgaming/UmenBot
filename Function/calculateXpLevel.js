// Returns the XP required to reach the specified level (level >= 1).
// Example: level 1 => 100 XP, level 2 => 200 XP, ...
// For level 0 (next is level 1), require at least 100 XP.
module.exports = (level) => {
	const target = Number(level) || 1;
	return Math.max(100 * target, 100);
};
