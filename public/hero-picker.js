const panel = document.querySelector('.hero-preview');
const artwork = document.querySelector('#previewArt');
const modelStage = document.querySelector('#draftModel');
const render = document.querySelector('#draftRender');
const turn = document.querySelector('#draftTurn');
const selection = document.querySelector('#selection');

let selectedId;
let rear = false;

// Pre-rendered views use the same geometry as the arena and also work without WebGL.
export function showHeroPreview(hero) {
 if (!modelStage || selectedId === hero.id) return;
 selectedId = hero.id;
 rear = false;
 artwork.src = '/assets/mila/portraits/' + hero.id + '.webp';
 artwork.alt = hero.name + ' · Tranh 2D';
 document.querySelector('#previewName').textContent = hero.name;
 document.querySelector('#previewRole').textContent = hero.role;
 document.querySelector('#previewTitle').textContent = hero.title;
 updateView();
}

function updateView() {
 const view = rear ? 'back' : 'front';
 render.src = '/assets/mila/draft/' + selectedId + '-' + view + '.webp';
 render.alt = document.querySelector('#previewName').textContent + (rear ? ' · Mặt sau mô hình 3D' : ' · Mặt trước mô hình 3D');
 turn.textContent = rear ? '↶ Mặt trước' : '↻ Mặt sau';
 turn.setAttribute('aria-pressed', String(rear));
}

turn?.addEventListener('click', () => {
 rear = !rear;
 updateView();
});

const detailButton = panel?.querySelector('#draftDetails');
export function bindHeroDetails(onDetail) {
 detailButton?.addEventListener('click', () => {
  if (selectedId && !selection.hidden) onDetail(selectedId);
 });
}
