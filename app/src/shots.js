import { drawCover } from './cover.js';
import { LAYOUTS } from './panels.js';

const params = new URLSearchParams(location.search);
const waitPaint = async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); window.__shotReady = true; };

export async function runShot(query, setup) {
  const q = new URLSearchParams(query || location.search); const names = (q.get('photo') || 'pier,boulevard').split(',').filter(Boolean);
  const loaded = {};
  await Promise.all(names.map(async name => { const img = new Image(); img.src = `./samples/${name}.jpg`; await img.decode(); loaded[name] = img; }));
  if (q.get('shot') === 'cover') {
    document.body.classList.add('shot-cover'); const canvas = document.querySelector('#cover');
    canvas.width = +(q.get('w') || 1080); canvas.height = +(q.get('h') || 1080);
    const photos = names.map(n => loaded[n]); const layout = LAYOUTS[q.get('layout')] ? q.get('layout') : 'showcase';
    const state = { photos, layout, panelState: Array.from({ length: LAYOUTS[layout].panels.length }, (_, i) => ({ photo: i % photos.length, zoom: 1, ox: 0, oy: 0, tone: 'normal' })), grade: q.get('grade') || 'sunset', title: q.get('title') || '', subtitle: q.get('subtitle') || '', titlePos: 'bottom', titleColor: 'pink' };
    if (setup) await setup({ ...loaded, state }); drawCover(canvas, state);
  } else if (q.get('shot') === 'editor') {
    if (setup) await setup(loaded);
    const layout = 'collage'; document.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('active', b.dataset.layout === layout));
    const canvas = document.querySelector('#cover'); if (canvas) drawCover(canvas, window.viceState || { photos: names.map(n => loaded[n]), layout, panelState: [], grade: 'sunset', title: 'VICE HEAT', subtitle: 'One city / no brakes' });
  }
  await waitPaint();
}
