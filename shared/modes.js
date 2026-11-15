export const versusModes = Object.freeze({duel: 1, trio: 3, squad: 5});

export const isVersus = mode => Object.hasOwn(versusModes, mode);
export const teamSize = mode => isVersus(mode) ? versusModes[mode] : 5;
export const modeLabel = mode => {
 if (!isVersus(mode)) return 'Giải đấu';
 const size = teamSize(mode);
 return `${size} vs ${size}`;
};
