import { LAYOUTS } from './panels.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wash = (ctx, w, h, stops, composite = 'soft-light', alpha = 1) => {
  ctx.save(); ctx.globalCompositeOperation = composite; ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
};

const COMIC = { levels: 5, sat: 1.45, contrast: 1.08, edgeLo: 14, edgeHi: 70, edgeAlpha: 1, tintSoft: .38, tintOverlay: .16 };
const COMIC_TINTS = ['#ff8a2a', '#4d7bff', '#b45cff', '#ffd23c', '#ff4d7e', '#ff8a2a', '#4d7bff'];
const toneCss = t => t === 'warm' ? 'sepia(.28)' : t === 'cool' ? 'hue-rotate(22deg) saturate(1.15)' : t === 'mono' ? 'grayscale(1)' : '';

function comicPanel(img, p, pw, ph, tint) {
  const w = Math.round(pw), h = Math.round(ph), canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const scale = Math.max(pw / img.width, ph / img.height) * clamp(p.zoom || 1, 1, 3);
  const dw = img.width * scale, dh = img.height * scale;
  const ox = clamp(p.ox || 0, -.5, .5) * Math.max(0, dw - pw), oy = clamp(p.oy || 0, -.5, .5) * Math.max(0, dh - ph);
  ctx.filter = `saturate(${COMIC.sat}) contrast(${COMIC.contrast}) ${toneCss(p.tone)}`;
  ctx.drawImage(img, (pw - dw) / 2 - ox, (ph - dh) / 2 - oy, dw, dh); ctx.filter = 'none';
  const small = document.createElement('canvas'); small.width = Math.max(1, Math.round(w / 2)); small.height = Math.max(1, Math.round(h / 2));
  const sctx = small.getContext('2d'); sctx.imageSmoothingEnabled = true; sctx.drawImage(canvas, 0, 0, small.width, small.height);
  ctx.imageSmoothingEnabled = true; ctx.clearRect(0, 0, w, h); ctx.drawImage(small, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h), data = image.data, lum = new Float32Array(w * h), step = 255 / (COMIC.levels - 1);
  for (let i = 0; i < w * h; i++) {
    const j = i * 4; lum[i] = .299 * data[j] + .587 * data[j + 1] + .114 * data[j + 2];
  }
  const mag = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const gx = -lum[i - w - 1] + lum[i - w + 1] - 2 * lum[i - 1] + 2 * lum[i + 1] - lum[i + w - 1] + lum[i + w + 1];
    const gy = -lum[i - w - 1] - 2 * lum[i - w] - lum[i - w + 1] + lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1];
    mag[i] = Math.hypot(gx, gy);
  }
  const dilated = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; let max = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) max = Math.max(max, mag[i + dy * w + dx]);
    dilated[i] = max;
  }
  for (let i = 0; i < w * h; i++) {
    const j = i * 4, a = clamp((dilated[i] / 4 - COMIC.edgeLo) / (COMIC.edgeHi - COMIC.edgeLo), 0, 1) * COMIC.edgeAlpha;
    for (let c = 0; c < 3; c++) data[j + c] = Math.round(Math.round(data[j + c] / step) * step * (1 - a));
  }
  ctx.putImageData(image, 0, 0);
  if (tint) {
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = COMIC.tintSoft; ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = COMIC.tintOverlay; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  return canvas;
}

function drawCenterTitle(ctx, W, H, state) {
  const words = String(state.title || '').toUpperCase().split(/\s+/).filter(Boolean);
  if (!words.length) return;
  const line2 = words.pop(), line1 = words.join(' '), lines = line1 ? [line1, line2] : [line2];
  const family = state.titleFont || 'Bowlby One'; let size = Math.round(H * .155);
  ctx.font = `${size}px ${family}, sans-serif`;
  while (Math.max(...lines.map(line => ctx.measureText(line).width)) > W * .88 && size > 20) { size -= 3; ctx.font = `${size}px ${family}, sans-serif`; }
  const lineStep = size * .87, cy = H * .415, firstY = cy - (lines.length - 1) * lineStep / 2;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = size * .18; ctx.strokeStyle = '#060606';
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = size * .05; ctx.shadowOffsetY = size * .04;
  ctx.letterSpacing = `${-size * .015}px`;
  lines.forEach((line, i) => { const y = firstY + i * lineStep; ctx.strokeText(line, W / 2, y); ctx.fillStyle = '#ffffff'; ctx.fillText(line, W / 2, y); });
  if (state.subtitle) {
    ctx.font = `${Math.round(H * .026)}px ${family}, sans-serif`; ctx.letterSpacing = `${Math.max(1, W * .004)}px`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const y = cy + (lines.length - 1) * lineStep / 2 + size * .74;
    ctx.lineWidth = Math.max(2, H * .026 * .16); ctx.strokeStyle = '#060606'; ctx.strokeText(String(state.subtitle), W / 2, y);
    ctx.fillStyle = '#ffffff'; ctx.fillText(String(state.subtitle), W / 2, y);
  }
  ctx.restore();
}

function grade(ctx, w, h, name) {
  if (name === 'sunset') {
    wash(ctx, w, h, [[0, 'rgba(6,20,57,.25)'], [.38, 'rgba(255,102,28,.16)'], [1, 'rgba(244,25,111,.62)']], 'overlay');
    wash(ctx, w, h, [[0, 'rgba(255,150,44,.10)'], [1, 'rgba(255,64,130,.20)']], 'soft-light');
    const top = ctx.createLinearGradient(0, 0, 0, h * .38); top.addColorStop(0, 'rgba(0,190,190,.20)'); top.addColorStop(1, 'rgba(0,190,190,0)');
    ctx.fillStyle = top; ctx.fillRect(0, 0, w, h * .4);
    const glow = ctx.createRadialGradient(w * .5, h * 1.02, 0, w * .5, h * 1.02, w * .75); glow.addColorStop(0, 'rgba(255,120,60,.32)'); glow.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
  } else if (name === 'neon') {
    const a = ctx.createRadialGradient(0, h, 0, 0, h, w * .9); a.addColorStop(0, 'rgba(255,0,145,.6)'); a.addColorStop(1, 'rgba(255,0,145,0)'); ctx.fillStyle = a; ctx.fillRect(0, 0, w, h);
    const b = ctx.createRadialGradient(w, 0, 0, w, 0, w * .8); b.addColorStop(0, 'rgba(0,220,255,.48)'); b.addColorStop(1, 'rgba(0,220,255,0)'); ctx.fillStyle = b; ctx.fillRect(0, 0, w, h);
  } else if (name === 'gold') wash(ctx, w, h, [[0, 'rgba(255,181,62,.22)'], [1, 'rgba(227,100,20,.5)']], 'soft-light');
  else if (name === 'midnight') wash(ctx, w, h, [[0, 'rgba(12,23,77,.45)'], [1, 'rgba(2,5,28,.62)']], 'source-over');
}

function textFill(ctx, w, h, color) {
  if (color === 'pink' || color === 'gold') {
    const g = ctx.createLinearGradient(0, h * .72, 0, h);
    g.addColorStop(0, color === 'pink' ? '#fff4f8' : '#fff6cb'); g.addColorStop(.5, color === 'pink' ? '#ffc2dd' : '#ffe89a'); g.addColorStop(1, color === 'pink' ? '#ff3f9c' : '#ffb52e'); return g;
  }
  return color === 'cyan' ? '#82f8ff' : '#fffdf7';
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d'); const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#080510'; ctx.fillRect(0, 0, W, H);
  const layout = LAYOUTS[state.layout] || LAYOUTS.showcase; const gap = state.grade === 'comic' ? Math.max(10, W * .016) : Math.max(8, W * .0085);
  for (let i = 0; i < layout.panels.length; i++) {
    const [x, y, rw, rh] = layout.panels[i], p = state.panelState?.[i] || {}, img = state.photos?.[p.photo ?? i] || state.photos?.[0];
    const x0 = x * W + gap / 2, y0 = y * H + gap / 2, pw = rw * W - gap, ph = rh * H - gap;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();
    if (img && state.grade === 'comic') {
      ctx.drawImage(comicPanel(img, p, pw, ph, COMIC_TINTS[i % COMIC_TINTS.length]), x0, y0, pw, ph);
    } else if (img) {
      const scale = Math.max(pw / img.width, ph / img.height) * clamp(p.zoom || 1, 1, 3);
      const dw = img.width * scale, dh = img.height * scale;
      const ox = clamp(p.ox || 0, -.5, .5) * Math.max(0, dw - pw), oy = clamp(p.oy || 0, -.5, .5) * Math.max(0, dh - ph);
      ctx.filter = `saturate(${state.grade === 'neon' ? 1.6 : 1.3}) contrast(${state.grade === 'gold' ? 1.08 : state.grade === 'midnight' ? 1.3 : 1.17}) ${p.tone === 'warm' ? 'sepia(.28)' : p.tone === 'cool' ? 'hue-rotate(22deg) saturate(1.15)' : p.tone === 'mono' ? 'grayscale(1)' : ''}`;
      ctx.drawImage(img, x0 + (pw - dw) / 2 - ox, y0 + (ph - dh) / 2 - oy, dw, dh); ctx.filter = 'none';
    } else { ctx.fillStyle = '#281c3c'; ctx.fillRect(x0, y0, pw, ph); }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = state.grade === 'comic' ? 'rgba(0,0,0,.92)' : 'rgba(5,2,12,.5)'; ctx.lineWidth = state.grade === 'comic' ? Math.max(3, W * .0035) : Math.max(2, W * .0022); ctx.strokeRect(x0 + ctx.lineWidth / 2, y0 + ctx.lineWidth / 2, pw - ctx.lineWidth, ph - ctx.lineWidth); ctx.restore();
  }
  if (state.grade !== 'comic') {
    grade(ctx, W, H, state.grade || 'sunset');
    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .28, W / 2, H / 2, Math.max(W, H) * .72);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(4,2,18,.62)'); ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }
  ctx.strokeStyle = state.grade === 'comic' ? 'rgba(0,0,0,.95)' : 'rgba(255,255,255,.86)'; ctx.lineWidth = Math.max(2, W * .002); ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  ctx.strokeStyle = 'rgba(5,2,12,.85)'; ctx.lineWidth = Math.max(1, W * .0011); const inset = Math.max(2, W * .002) + 2; ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  if (state.titlePos === 'center') drawCenterTitle(ctx, W, H, state);
  else {
  const bottom = state.titlePos !== 'top', title = String(state.title || 'VICE HEAT').toUpperCase();
  const yBase = bottom ? H * .83 : H * .2;
  const scrim = ctx.createLinearGradient(0, bottom ? H * .62 : 0, 0, bottom ? H : H * .42);
  scrim.addColorStop(0, 'rgba(7,4,20,0)'); scrim.addColorStop(1, 'rgba(7,4,20,.74)'); ctx.fillStyle = scrim; ctx.fillRect(0, bottom ? H * .58 : 0, W, H * .42);
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `900 ${Math.round(H * .116)}px ViceBlack, sans-serif`;
  let size = Math.round(H * .116); while (ctx.measureText(title).width > W * .92 && size > 18) { size -= 2; ctx.font = `900 ${size}px ViceBlack, sans-serif`; }
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(5, size * .12); ctx.strokeStyle = 'rgba(13,5,24,.9)'; ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = size * .25; ctx.shadowOffsetY = size * .07;
  ctx.strokeText(title, W / 2, yBase); ctx.fillStyle = textFill(ctx, W, H, state.titleColor || 'white'); ctx.fillText(title, W / 2, yBase); ctx.restore();
  if (state.subtitle) { ctx.save(); ctx.font = `700 ${Math.round(H * .03)}px ViceBold, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.shadowColor = '#090312'; ctx.shadowBlur = 8; ctx.letterSpacing = `${Math.max(1, W * .002)}px`; ctx.fillText(String(state.subtitle).toUpperCase(), W / 2, yBase + H * .078, W * .9); ctx.restore(); }
  }
  const tag = state.tag || 'FAN-MADE COVER'; ctx.save(); ctx.font = `700 ${Math.round(W * .015)}px ViceBold, sans-serif`; const tw = ctx.measureText(tag).width;
  const tx = W * .035, ty = H * .035, th = W * .034, pad = W * .014; ctx.fillStyle = '#fa2386'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = Math.max(6, W * .008); ctx.beginPath(); ctx.roundRect(tx, ty, tw + pad * 2, th, th / 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(tag, tx + pad, ty + th / 2); ctx.restore();
}

export function renderExport(state, w, h) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; drawCover(canvas, state); return canvas;
}
