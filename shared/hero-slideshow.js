export function createHeroSlideshow(image, caption, heroes, sheetUrl) {
 let shown = 0;
 let nextAt = 0;
 let preload;
 let fade;
 function show(index, now) {
  shown = index;
  nextAt = now + 4000;
  const hero = heroes[index];
  image.src = sheetUrl(hero.id);
  image.alt = hero.name + ' và chiêu thức';
  if (caption) caption.textContent = hero.name + ' · ' + hero.role;
  if (typeof image.animate === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
   fade?.cancel();
   fade = image.animate([{opacity: .45}, {opacity: 1}], 320);
  }
  preload = new Image();
  preload.src = sheetUrl(heroes[(index + 1) % heroes.length].id);
 }
 return {
  start(now) { show(0, now); },
  tick(now) { if (now >= nextAt) show((shown + 1) % heroes.length, now); },
  get hero() { return heroes[shown]; }
 };
}
