import { LAYOUTS, panelAt } from './panels.js';
import { drawCover, renderExport } from './cover.js';
import { runShot } from './shots.js';

export function loadImage(url) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url; }); }

const canvas = document.querySelector('#cover');
const state = { photos: [], layout: 'collage', panelState: [], grade: 'sunset', title: 'VICE HEAT', subtitle: 'One city / no brakes', titlePos: 'bottom', titleColor: 'pink', tag: 'FAN-MADE COVER' };
window.viceState = state; let selected = 0, chosenPhoto = 0, drag = null;
const $ = s => document.querySelector(s);
const redraw = () => drawCover(canvas, state);
const setStatus = message => { $('#status').textContent = message; };
function ensurePanels() { while (state.panelState.length < LAYOUTS[state.layout].panels.length) state.panelState.push({ photo: state.panelState.length % Math.max(1, state.photos.length), zoom: 1, ox: 0, oy: 0, tone: 'normal' }); state.panelState.length = LAYOUTS[state.layout].panels.length; selected = Math.min(selected, state.panelState.length - 1); }
function renderLibrary() { const lib = $('#library'); lib.replaceChildren(); state.photos.forEach((img, i) => { const thumb = document.createElement('img'); thumb.src = img.src; thumb.className = `thumb${i === chosenPhoto ? ' selected' : ''}`; thumb.title = img.name || `Photo ${i + 1}`; thumb.onclick = () => { chosenPhoto = i; renderLibrary(); }; lib.append(thumb); }); }
function renderLayouts() { const wrap = $('#layouts'); wrap.replaceChildren(); Object.entries(LAYOUTS).forEach(([key, value]) => { const b = document.createElement('button'); b.textContent = value.label; b.classList.toggle('active', state.layout === key); b.dataset.layout = key; b.onclick = () => { state.layout = key; ensurePanels(); renderLayouts(); renderChips(); syncControls(); redraw(); }; wrap.append(b); }); }
function renderChips() { const wrap = $('#panelChips'); wrap.replaceChildren(); state.panelState.forEach((p, i) => { const b = document.createElement('button'); b.textContent = `Panel ${i + 1}`; b.classList.toggle('active', selected === i); b.onclick = () => { selected = i; renderChips(); syncControls(); }; wrap.append(b); }); }
function syncControls() { const p = state.panelState[selected] || {}; $('#zoom').value = p.zoom ?? 1; $('#moveX').value = Math.round((p.ox || 0) * 100); $('#moveY').value = Math.round((p.oy || 0) * 100); $('#tone').value = p.tone || 'normal'; }
function assign(photo) { const p = state.panelState[selected]; if (p) p.photo = photo; redraw(); }
function addPhoto(img, name) { img.name = name; state.photos.push(img); chosenPhoto = state.photos.length - 1; ensurePanels(); renderLibrary(); renderChips(); redraw(); }
function filePhotos(files) { for (const file of files) { if (!file.type.startsWith('image/')) continue; const url = URL.createObjectURL(file); loadImage(url).then(img => addPhoto(img, file.name)); } }

$('#photoInput').addEventListener('change', e => filePhotos(e.target.files));
document.addEventListener('dragover', e => e.preventDefault()); document.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files.length) filePhotos(e.dataTransfer.files); });
canvas.addEventListener('click', e => { const r = canvas.getBoundingClientRect(); const i = panelAt(state.layout, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); if (i >= 0) { selected = i; if (state.photos.length) assign(chosenPhoto); renderChips(); syncControls(); } });
canvas.addEventListener('pointerdown', e => { const r = canvas.getBoundingClientRect(); const i = panelAt(state.layout, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); if (i >= 0) { selected = i; drag = { x: e.clientX, y: e.clientY, i }; canvas.setPointerCapture(e.pointerId); renderChips(); syncControls(); } });
canvas.addEventListener('pointermove', e => { if (!drag) return; const p = state.panelState[drag.i], r = canvas.getBoundingClientRect(); p.ox = Math.max(-.5, Math.min(.5, p.ox - (e.clientX - drag.x) / r.width)); p.oy = Math.max(-.5, Math.min(.5, p.oy - (e.clientY - drag.y) / r.height)); drag.x = e.clientX; drag.y = e.clientY; syncControls(); redraw(); });
canvas.addEventListener('pointerup', () => { drag = null; });
for (const [id, key, scale] of [['zoom', 'zoom', 1], ['moveX', 'ox', .01], ['moveY', 'oy', .01]]) $(`#${id}`).addEventListener('input', e => { state.panelState[selected][key] = +e.target.value * scale; redraw(); });
$('#tone').addEventListener('change', e => { state.panelState[selected].tone = e.target.value; redraw(); });
$('#nextPhoto').onclick = () => { if (state.photos.length) { chosenPhoto = (chosenPhoto + 1) % state.photos.length; assign(chosenPhoto); renderLibrary(); } };
$('#samePhoto').onclick = () => { state.panelState.forEach(p => p.photo = chosenPhoto); redraw(); };
for (const [id, name] of [['samplePier', 'pier'], ['sampleBoulevard', 'boulevard']]) $(`#${id}`).onclick = async () => { try { addPhoto(await loadImage(`./samples/${name}.jpg`), name); setStatus(`Loaded sample: ${name === 'pier' ? 'Pier' : 'Boulevard'}`); } catch { setStatus(`Could not load sample: ${name}`); } };
$('#grade').onchange = e => { state.grade = e.target.value; redraw(); };
$('#title').oninput = e => { state.title = e.target.value; redraw(); }; $('#subtitle').oninput = e => { state.subtitle = e.target.value; redraw(); };
$('#titlePos').onchange = e => { state.titlePos = e.target.value; redraw(); }; $('#titleColor').onchange = e => { state.titleColor = e.target.value; redraw(); };
document.querySelectorAll('[data-size]').forEach(button => button.onclick = async () => { const [w, h] = button.dataset.size.split(',').map(Number); await document.fonts.ready; const out = renderExport(state, w, h); const link = document.createElement('a'); const name = `vice-cover-${w}x${h}.png`; link.download = name; link.href = out.toDataURL('image/png'); link.click(); setStatus(`Saved ${name}`); });

async function start() {
  if (location.search.includes('shot=')) { await runShot(location.search, async samples => { if (samples.state) { Object.assign(state, samples.state); } else { state.photos = Object.values(samples); state.layout = 'collage'; ensurePanels(); } renderLayouts(); ensurePanels(); renderChips(); renderLibrary(); redraw(); }); return; }
  try { state.photos = await Promise.all([loadImage('./samples/pier.jpg'), loadImage('./samples/boulevard.jpg')]); state.photos[0].name = 'Pier'; state.photos[1].name = 'Boulevard'; ensurePanels(); state.panelState.forEach((p, i) => p.photo = i % 2); }
  catch { state.panelState = []; ensurePanels(); }
  renderLayouts(); renderChips(); renderLibrary(); syncControls(); redraw();
}
start();
