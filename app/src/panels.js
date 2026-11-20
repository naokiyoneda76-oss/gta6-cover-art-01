export const LAYOUTS = {
  showcase: { label: 'Showcase', panels: [[0, 0, 1, 1]] },
  duo: { label: 'Duo', panels: [[0, 0, .58, 1], [.58, 0, .42, 1]] },
  trio: { label: 'Trio', panels: [[0, 0, .4, 1], [.4, 0, .3, 1], [.7, 0, .3, 1]] },
  collage: { label: 'Collage', panels: [[0, 0, .55, .58], [.55, 0, .45, .34], [.55, .34, .45, .24], [0, .58, .36, .42], [.36, .58, .64, .42]] },
  grid6: { label: 'Grid 6', panels: Array.from({ length: 6 }, (_, i) => [(i % 3) / 3, Math.floor(i / 3) / 2, 1 / 3, 1 / 2]) }
};

export function panelAt(layout, nx, ny) {
  const panels = (LAYOUTS[layout] || LAYOUTS.showcase).panels;
  return panels.findIndex(([x, y, w, h]) => nx >= x && nx <= x + w && ny >= y && ny <= y + h);
}
