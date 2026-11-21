import { drawCover } from './cover.js';
import { LAYOUTS, panelCrop } from './panels.js';

const params = new URLSearchParams(location.search);
const waitPaint = async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); window.__shotReady = true; };
const fontsReady = async () => { try { await Promise.all([document.fonts.load('900 100px ViceBlack'), document.fonts.load('700 100px ViceBold'), document.fonts.load('100px Anton'), document.fonts.load('100px "Bowlby One"'), document.fonts.load('100px Pricedown')]); } catch {} };

export async function runShot(query, setup) {
  const q = new URLSearchParams(query || location.search); const names = (q.get('photo') || 'pier,boulevard').split(',').filter(Boolean);
  const loaded = {};
  await Promise.all(names.map(async name => { const img = new Image(); img.src = `./samples/${name}.jpg`; await img.decode(); loaded[name] = img; }));
  if (q.get('shot') === 'cover') {
    document.body.classList.add('shot-cover'); const canvas = document.querySelector('#cover');
    canvas.width = +(q.get('w') || 1080); canvas.height = +(q.get('h') || 1080);
    const photos = names.map(n => loaded[n]); const layout = LAYOUTS[q.get('layout')] ? q.get('layout') : 'showcase';
    const state = { photos, layout, panelState: Array.from({ length: LAYOUTS[layout].panels.length }, (_, i) => ({ ...panelCrop(layout, i), photo: i % photos.length })), grade: q.get('grade') || 'sunset', title: q.get('title') || '', subtitle: q.get('subtitle') || '', titlePos: q.get('titlepos') || 'bottom', titleFont: q.get('titlefont') || '', titleColor: 'pink' };
    await fontsReady(); if (setup) await setup({ ...loaded, state }); drawCover(canvas, state);
  } else if (q.get('shot') === 'editor') {
    await fontsReady(); if (setup) await setup(loaded);
    const layout = 'collage'; document.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('active', b.dataset.layout === layout));
    const canvas = document.querySelector('#cover'); if (canvas) drawCover(canvas, window.viceState || { photos: names.map(n => loaded[n]), layout, panelState: [], grade: 'sunset', title: 'VICE HEAT', subtitle: 'One city / no brakes' });
  }
  await waitPaint();
}
