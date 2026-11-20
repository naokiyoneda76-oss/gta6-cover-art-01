import { LAYOUTS } from './panels.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wash = (ctx, w, h, stops, composite = 'soft-light', alpha = 1) => {
  ctx.save(); ctx.globalCompositeOperation = composite; ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
};

function grade(ctx, w, h, name) {
  if (name === 'sunset') {
    wash(ctx, w, h, [[0, 'rgba(6,20,57,.25)'], [.38, 'rgba(255,102,28,.16)'], [1, 'rgba(244,25,111,.62)']], 'overlay');
    wash(ctx, w, h, [[0, 'rgba(255,150,44,.10)'], [1, 'rgba(255,64,130,.20)']], 'soft-light');
    const top = ctx.createLinearGradient(0, 0, 0, h * .38); top.addColorStop(0, 'rgba(0,190,190,.20)'); top.addColorStop(1, 'rgba(0,190,190,0)');
    ctx.fillStyle = top; ctx.fillRect(0, 0, w, h * .4);
  } else if (name === 'neon') {
    const a = ctx.createRadialGradient(0, h, 0, 0, h, w * .9); a.addColorStop(0, 'rgba(255,0,145,.5)'); a.addColorStop(1, 'rgba(255,0,145,0)'); ctx.fillStyle = a; ctx.fillRect(0, 0, w, h);
    const b = ctx.createRadialGradient(w, 0, 0, w, 0, w * .8); b.addColorStop(0, 'rgba(0,220,255,.38)'); b.addColorStop(1, 'rgba(0,220,255,0)'); ctx.fillStyle = b; ctx.fillRect(0, 0, w, h);
  } else if (name === 'gold') wash(ctx, w, h, [[0, 'rgba(255,181,62,.13)'], [1, 'rgba(227,100,20,.38)']], 'soft-light');
  else if (name === 'midnight') wash(ctx, w, h, [[0, 'rgba(12,23,77,.45)'], [1, 'rgba(2,5,28,.62)']], 'source-over');
}

function textFill(ctx, w, h, color) {
  if (color === 'pink' || color === 'gold') {
    const g = ctx.createLinearGradient(0, h * .72, 0, h);
    g.addColorStop(0, color === 'pink' ? '#fff4f8' : '#fff6cb'); g.addColorStop(1, color === 'pink' ? '#ff3f9c' : '#ffb52e'); return g;
  }
  return color === 'cyan' ? '#82f8ff' : '#fffdf7';
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d'); const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#10091d'; ctx.fillRect(0, 0, W, H);
  const layout = LAYOUTS[state.layout] || LAYOUTS.showcase; const gap = Math.max(5, W * .005);
  for (let i = 0; i < layout.panels.length; i++) {
    const [x, y, rw, rh] = layout.panels[i], p = state.panelState?.[i] || {}, img = state.photos?.[p.photo ?? i] || state.photos?.[0];
    const x0 = x * W + gap / 2, y0 = y * H + gap / 2, pw = rw * W - gap, ph = rh * H - gap;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();
    if (img) {
      const scale = Math.max(pw / img.width, ph / img.height) * clamp(p.zoom || 1, 1, 3);
      const dw = img.width * scale, dh = img.height * scale;
      const ox = clamp(p.ox || 0, -.5, .5) * Math.max(0, dw - pw), oy = clamp(p.oy || 0, -.5, .5) * Math.max(0, dh - ph);
      ctx.filter = `saturate(${state.grade === 'neon' ? 1.45 : 1.15}) contrast(${state.grade === 'gold' ? 1.02 : state.grade === 'midnight' ? 1.3 : 1.12}) ${p.tone === 'warm' ? 'sepia(.28)' : p.tone === 'cool' ? 'hue-rotate(22deg) saturate(1.15)' : p.tone === 'mono' ? 'grayscale(1)' : ''}`;
      ctx.drawImage(img, x0 + (pw - dw) / 2 - ox, y0 + (ph - dh) / 2 - oy, dw, dh); ctx.filter = 'none';
    } else { ctx.fillStyle = '#281c3c'; ctx.fillRect(x0, y0, pw, ph); }
    ctx.restore();
  }
  grade(ctx, W, H, state.grade || 'sunset');
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .28, W / 2, H / 2, Math.max(W, H) * .72);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(4,2,18,.57)'); ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.86)'; ctx.lineWidth = Math.max(2, W * .002); ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  const bottom = state.titlePos !== 'top', title = String(state.title || 'VICE HEAT').toUpperCase();
  const yBase = bottom ? H * .83 : H * .2;
  const scrim = ctx.createLinearGradient(0, bottom ? H * .62 : 0, 0, bottom ? H : H * .42);
  scrim.addColorStop(0, 'rgba(7,4,20,0)'); scrim.addColorStop(1, 'rgba(7,4,20,.74)'); ctx.fillStyle = scrim; ctx.fillRect(0, bottom ? H * .58 : 0, W, H * .42);
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `900 ${Math.round(H * .105)}px ViceBlack, sans-serif`;
  let size = Math.round(H * .105); while (ctx.measureText(title).width > W * .92 && size > 18) { size -= 2; ctx.font = `900 ${size}px ViceBlack, sans-serif`; }
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(5, size * .11); ctx.strokeStyle = 'rgba(13,5,24,.9)'; ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = size * .2; ctx.shadowOffsetY = size * .07;
  ctx.strokeText(title, W / 2, yBase); ctx.fillStyle = textFill(ctx, W, H, state.titleColor || 'white'); ctx.fillText(title, W / 2, yBase); ctx.restore();
  if (state.subtitle) { ctx.save(); ctx.font = `700 ${Math.round(H * .027)}px ViceBold, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.shadowColor = '#090312'; ctx.shadowBlur = 8; ctx.letterSpacing = `${Math.max(1, W * .0015)}px`; ctx.fillText(state.subtitle, W / 2, yBase + H * .075, W * .9); ctx.restore(); }
  const tag = state.tag || 'FAN-MADE COVER'; ctx.save(); ctx.font = `700 ${Math.round(W * .015)}px ViceBold, sans-serif`; const tw = ctx.measureText(tag).width;
  const tx = W * .035, ty = H * .035, th = W * .034, pad = W * .014; ctx.fillStyle = '#fa2386'; ctx.beginPath(); ctx.roundRect(tx, ty, tw + pad * 2, th, th / 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(tag, tx + pad, ty + th / 2); ctx.restore();
}

export function renderExport(state, w, h) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; drawCover(canvas, state); return canvas;
}
