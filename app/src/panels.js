export const LAYOUTS = {
  showcase: { label: 'Showcase', panels: [[0, 0, 1, 1]] },
  duo: { label: 'Duo', panels: [[0, 0, .58, 1], [.58, 0, .42, 1]] },
  trio: { label: 'Trio', panels: [[0, 0, .4, 1], [.4, 0, .3, 1], [.7, 0, .3, 1]] },
  collage: { label: 'Collage', panels: [[0, 0, .55, .58], [.55, 0, .45, .34], [.55, .34, .45, .24], [0, .58, .36, .42], [.36, .58, .64, .42]] },
  grid6: { label: 'Grid 6', panels: Array.from({ length: 6 }, (_, i) => [(i % 3) / 3, Math.floor(i / 3) / 2, 1 / 3, 1 / 2]) },
  hero: { label: 'Hero', panels: [[0, 0, 1, .56], [0, .56, .46, .44], [.46, .56, .27, .44], [.73, .56, .27, .44]] },
  gta: { label: 'GTA Center', panels: [[0, 0, .54, .23], [.54, 0, .46, .23], [0, .23, .5, .37], [.5, .23, .5, .37], [0, .6, .36, .4], [.36, .6, .34, .4], [.7, .6, .3, .4]] }
};

export function panelAt(layout, nx, ny) {
  const panels = (LAYOUTS[layout] || LAYOUTS.showcase).panels;
  return panels.findIndex(([x, y, w, h]) => nx >= x && nx <= x + w && ny >= y && ny <= y + h);
}


export const PANEL_CROPS = {
  showcase: [{ zoom: 1, ox: 0, oy: 0, tone: 'normal' }],
  duo: [{ zoom: 1.05, ox: -.05, oy: -.03, tone: 'normal' }, { zoom: 1.12, ox: .06, oy: -.08, tone: 'warm' }],
  trio: [{ zoom: 1.22, ox: -.14, oy: -.12, tone: 'normal' }, { zoom: 1.05, ox: 0, oy: -.02, tone: 'warm' }, { zoom: 1.22, ox: .14, oy: -.12, tone: 'cool' }],
  collage: [{ zoom: 1.02, ox: 0, oy: -.02, tone: 'normal' }, { zoom: 1.3, ox: .1, oy: -.4, tone: 'warm' }, { zoom: 1.15, ox: 0, oy: -.3, tone: 'normal' }, { zoom: 1.2, ox: -.05, oy: -.4, tone: 'cool' }, { zoom: 1.05, ox: 0, oy: -.4, tone: 'warm' }],
  grid6: [{ zoom: 1.18, ox: -.1, oy: -.14, tone: 'normal' }, { zoom: 1.08, ox: .05, oy: -.03, tone: 'warm' }, { zoom: 1.55, ox: .1, oy: -.3, tone: 'normal' }, { zoom: 1.26, ox: .1, oy: .02, tone: 'warm' }, { zoom: 1.03, ox: 0, oy: -.04, tone: 'normal' }, { zoom: 1.2, ox: -.12, oy: 0, tone: 'cool' }],
  hero: [{ zoom: 1, ox: 0, oy: -.3, tone: 'normal' }, { zoom: 1, ox: -.45, oy: 0, tone: 'normal' }, { zoom: 1.6, ox: .17, oy: -.33, tone: 'warm' }, { zoom: 1.3, ox: -.12, oy: -.35, tone: 'normal' }],
  gta: [{ zoom: 1.22, ox: .2, oy: -.48, tone: 'normal' }, { zoom: 1.7, ox: -.19, oy: -.36, tone: 'normal', tint: '#17b6cf', tintMix: .65 }, { zoom: 1.15, ox: .35, oy: -.43, tone: 'warm' }, { zoom: 1.2, ox: -.45, oy: -.5, tone: 'normal' }, { zoom: 1.1, ox: .5, oy: -.5, tone: 'warm' }, { zoom: 1.25, ox: -.17, oy: -.42, tone: 'normal' }, { zoom: 1.35, ox: .24, oy: -.39, tone: 'normal' }]
};

export function panelCrop(layout, i) {
  const list = PANEL_CROPS[layout] || PANEL_CROPS.showcase;
  return list[i % list.length];
}
