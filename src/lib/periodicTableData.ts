export interface Element {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: ElementCategory;
  group: number | null;
  period: number;
  block: string;
  electronConfiguration: string;
  electronegativity: number | null;
  density: number | null;
  meltingPoint: number | null; // K
  boilingPoint: number | null; // K
  oxidationStates: string;
  state: 'solid' | 'liquid' | 'gas';
  yearDiscovered: string;
  row: number;
  col: number;
}

export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide';

export const categoryColors: Record<ElementCategory, string> = {
  'alkali-metal': 'hsl(0 70% 50%)',
  'alkaline-earth': 'hsl(30 70% 50%)',
  'transition-metal': 'hsl(210 60% 50%)',
  'post-transition-metal': 'hsl(170 50% 45%)',
  'metalloid': 'hsl(50 70% 45%)',
  'nonmetal': 'hsl(120 50% 40%)',
  'halogen': 'hsl(280 60% 55%)',
  'noble-gas': 'hsl(320 50% 50%)',
  'lanthanide': 'hsl(190 60% 45%)',
  'actinide': 'hsl(350 50% 45%)',
};

export const categoryLabels: Record<ElementCategory, string> = {
  'alkali-metal': 'Alkali Metal',
  'alkaline-earth': 'Alkaline Earth',
  'transition-metal': 'Transition Metal',
  'post-transition-metal': 'Post-Transition Metal',
  'metalloid': 'Metalloid',
  'nonmetal': 'Nonmetal',
  'halogen': 'Halogen',
  'noble-gas': 'Noble Gas',
  'lanthanide': 'Lanthanide',
  'actinide': 'Actinide',
};

export const elements: Element[] = [
  // Period 1
  { atomicNumber: 1, symbol: 'H', name: 'Hydrogen', atomicMass: 1.008, category: 'nonmetal', group: 1, period: 1, block: 's', electronConfiguration: '1s¹', electronegativity: 2.20, density: 0.00009, meltingPoint: 14.01, boilingPoint: 20.28, oxidationStates: '-1, +1', state: 'gas', yearDiscovered: '1766', row: 1, col: 1 },
  { atomicNumber: 2, symbol: 'He', name: 'Helium', atomicMass: 4.003, category: 'noble-gas', group: 18, period: 1, block: 's', electronConfiguration: '1s²', electronegativity: null, density: 0.00018, meltingPoint: 0.95, boilingPoint: 4.22, oxidationStates: '0', state: 'gas', yearDiscovered: '1868', row: 1, col: 18 },

  // Period 2
  { atomicNumber: 3, symbol: 'Li', name: 'Lithium', atomicMass: 6.941, category: 'alkali-metal', group: 1, period: 2, block: 's', electronConfiguration: '[He] 2s¹', electronegativity: 0.98, density: 0.534, meltingPoint: 453.69, boilingPoint: 1615, oxidationStates: '+1', state: 'solid', yearDiscovered: '1817', row: 2, col: 1 },
  { atomicNumber: 4, symbol: 'Be', name: 'Beryllium', atomicMass: 9.012, category: 'alkaline-earth', group: 2, period: 2, block: 's', electronConfiguration: '[He] 2s²', electronegativity: 1.57, density: 1.85, meltingPoint: 1560, boilingPoint: 2744, oxidationStates: '+2', state: 'solid', yearDiscovered: '1798', row: 2, col: 2 },
  { atomicNumber: 5, symbol: 'B', name: 'Boron', atomicMass: 10.81, category: 'metalloid', group: 13, period: 2, block: 'p', electronConfiguration: '[He] 2s² 2p¹', electronegativity: 2.04, density: 2.34, meltingPoint: 2349, boilingPoint: 4200, oxidationStates: '+3', state: 'solid', yearDiscovered: '1808', row: 2, col: 13 },
  { atomicNumber: 6, symbol: 'C', name: 'Carbon', atomicMass: 12.011, category: 'nonmetal', group: 14, period: 2, block: 'p', electronConfiguration: '[He] 2s² 2p²', electronegativity: 2.55, density: 2.267, meltingPoint: 3823, boilingPoint: 4098, oxidationStates: '-4, +4', state: 'solid', yearDiscovered: 'Ancient', row: 2, col: 14 },
  { atomicNumber: 7, symbol: 'N', name: 'Nitrogen', atomicMass: 14.007, category: 'nonmetal', group: 15, period: 2, block: 'p', electronConfiguration: '[He] 2s² 2p³', electronegativity: 3.04, density: 0.0013, meltingPoint: 63.15, boilingPoint: 77.36, oxidationStates: '-3, +3, +5', state: 'gas', yearDiscovered: '1772', row: 2, col: 15 },
  { atomicNumber: 8, symbol: 'O', name: 'Oxygen', atomicMass: 15.999, category: 'nonmetal', group: 16, period: 2, block: 'p', electronConfiguration: '[He] 2s² 2p⁴', electronegativity: 3.44, density: 0.0014, meltingPoint: 54.36, boilingPoint: 90.20, oxidationStates: '-2', state: 'gas', yearDiscovered: '1774', row: 2, col: 16 },
  { atomicNumber: 9, symbol: 'F', name: 'Fluorine', atomicMass: 18.998, category: 'halogen', group: 17, period: 2, block: 'p', electronConfiguration: '[He] 2s² 2p⁵', electronegativity: 3.98, density: 0.0017, meltingPoint: 53.53, boilingPoint: 85.03, oxidationStates: '-1', state: 'gas', yearDiscovered: '1886', row: 2, col: 17 },
  { atomicNumber: 10, symbol: 'Ne', name: 'Neon', atomicMass: 20.180, category: 'noble-gas', group: 18, period: 2, block: 'p', electronConfiguration: '[He] 2s² 2p⁶', electronegativity: null, density: 0.0009, meltingPoint: 24.56, boilingPoint: 27.07, oxidationStates: '0', state: 'gas', yearDiscovered: '1898', row: 2, col: 18 },

  // Period 3
  { atomicNumber: 11, symbol: 'Na', name: 'Sodium', atomicMass: 22.990, category: 'alkali-metal', group: 1, period: 3, block: 's', electronConfiguration: '[Ne] 3s¹', electronegativity: 0.93, density: 0.971, meltingPoint: 370.87, boilingPoint: 1156, oxidationStates: '+1', state: 'solid', yearDiscovered: '1807', row: 3, col: 1 },
  { atomicNumber: 12, symbol: 'Mg', name: 'Magnesium', atomicMass: 24.305, category: 'alkaline-earth', group: 2, period: 3, block: 's', electronConfiguration: '[Ne] 3s²', electronegativity: 1.31, density: 1.738, meltingPoint: 923, boilingPoint: 1363, oxidationStates: '+2', state: 'solid', yearDiscovered: '1755', row: 3, col: 2 },
  { atomicNumber: 13, symbol: 'Al', name: 'Aluminium', atomicMass: 26.982, category: 'post-transition-metal', group: 13, period: 3, block: 'p', electronConfiguration: '[Ne] 3s² 3p¹', electronegativity: 1.61, density: 2.698, meltingPoint: 933.47, boilingPoint: 2792, oxidationStates: '+3', state: 'solid', yearDiscovered: '1825', row: 3, col: 13 },
  { atomicNumber: 14, symbol: 'Si', name: 'Silicon', atomicMass: 28.086, category: 'metalloid', group: 14, period: 3, block: 'p', electronConfiguration: '[Ne] 3s² 3p²', electronegativity: 1.90, density: 2.3296, meltingPoint: 1687, boilingPoint: 3538, oxidationStates: '-4, +4', state: 'solid', yearDiscovered: '1824', row: 3, col: 14 },
  { atomicNumber: 15, symbol: 'P', name: 'Phosphorus', atomicMass: 30.974, category: 'nonmetal', group: 15, period: 3, block: 'p', electronConfiguration: '[Ne] 3s² 3p³', electronegativity: 2.19, density: 1.82, meltingPoint: 317.30, boilingPoint: 550, oxidationStates: '-3, +3, +5', state: 'solid', yearDiscovered: '1669', row: 3, col: 15 },
  { atomicNumber: 16, symbol: 'S', name: 'Sulfur', atomicMass: 32.065, category: 'nonmetal', group: 16, period: 3, block: 'p', electronConfiguration: '[Ne] 3s² 3p⁴', electronegativity: 2.58, density: 2.067, meltingPoint: 388.36, boilingPoint: 717.87, oxidationStates: '-2, +4, +6', state: 'solid', yearDiscovered: 'Ancient', row: 3, col: 16 },
  { atomicNumber: 17, symbol: 'Cl', name: 'Chlorine', atomicMass: 35.453, category: 'halogen', group: 17, period: 3, block: 'p', electronConfiguration: '[Ne] 3s² 3p⁵', electronegativity: 3.16, density: 0.0032, meltingPoint: 171.6, boilingPoint: 239.11, oxidationStates: '-1, +1, +5, +7', state: 'gas', yearDiscovered: '1774', row: 3, col: 17 },
  { atomicNumber: 18, symbol: 'Ar', name: 'Argon', atomicMass: 39.948, category: 'noble-gas', group: 18, period: 3, block: 'p', electronConfiguration: '[Ne] 3s² 3p⁶', electronegativity: null, density: 0.0018, meltingPoint: 83.80, boilingPoint: 87.30, oxidationStates: '0', state: 'gas', yearDiscovered: '1894', row: 3, col: 18 },

  // Period 4
  { atomicNumber: 19, symbol: 'K', name: 'Potassium', atomicMass: 39.098, category: 'alkali-metal', group: 1, period: 4, block: 's', electronConfiguration: '[Ar] 4s¹', electronegativity: 0.82, density: 0.862, meltingPoint: 336.53, boilingPoint: 1032, oxidationStates: '+1', state: 'solid', yearDiscovered: '1807', row: 4, col: 1 },
  { atomicNumber: 20, symbol: 'Ca', name: 'Calcium', atomicMass: 40.078, category: 'alkaline-earth', group: 2, period: 4, block: 's', electronConfiguration: '[Ar] 4s²', electronegativity: 1.00, density: 1.55, meltingPoint: 1115, boilingPoint: 1757, oxidationStates: '+2', state: 'solid', yearDiscovered: '1808', row: 4, col: 2 },
  { atomicNumber: 21, symbol: 'Sc', name: 'Scandium', atomicMass: 44.956, category: 'transition-metal', group: 3, period: 4, block: 'd', electronConfiguration: '[Ar] 3d¹ 4s²', electronegativity: 1.36, density: 2.989, meltingPoint: 1814, boilingPoint: 3109, oxidationStates: '+3', state: 'solid', yearDiscovered: '1879', row: 4, col: 3 },
  { atomicNumber: 22, symbol: 'Ti', name: 'Titanium', atomicMass: 47.867, category: 'transition-metal', group: 4, period: 4, block: 'd', electronConfiguration: '[Ar] 3d² 4s²', electronegativity: 1.54, density: 4.54, meltingPoint: 1941, boilingPoint: 3560, oxidationStates: '+2, +3, +4', state: 'solid', yearDiscovered: '1791', row: 4, col: 4 },
  { atomicNumber: 23, symbol: 'V', name: 'Vanadium', atomicMass: 50.942, category: 'transition-metal', group: 5, period: 4, block: 'd', electronConfiguration: '[Ar] 3d³ 4s²', electronegativity: 1.63, density: 6.11, meltingPoint: 2183, boilingPoint: 3680, oxidationStates: '+2, +3, +4, +5', state: 'solid', yearDiscovered: '1801', row: 4, col: 5 },
  { atomicNumber: 24, symbol: 'Cr', name: 'Chromium', atomicMass: 51.996, category: 'transition-metal', group: 6, period: 4, block: 'd', electronConfiguration: '[Ar] 3d⁵ 4s¹', electronegativity: 1.66, density: 7.15, meltingPoint: 2180, boilingPoint: 2944, oxidationStates: '+2, +3, +6', state: 'solid', yearDiscovered: '1797', row: 4, col: 6 },
  { atomicNumber: 25, symbol: 'Mn', name: 'Manganese', atomicMass: 54.938, category: 'transition-metal', group: 7, period: 4, block: 'd', electronConfiguration: '[Ar] 3d⁵ 4s²', electronegativity: 1.55, density: 7.44, meltingPoint: 1519, boilingPoint: 2334, oxidationStates: '+2, +4, +7', state: 'solid', yearDiscovered: '1774', row: 4, col: 7 },
  { atomicNumber: 26, symbol: 'Fe', name: 'Iron', atomicMass: 55.845, category: 'transition-metal', group: 8, period: 4, block: 'd', electronConfiguration: '[Ar] 3d⁶ 4s²', electronegativity: 1.83, density: 7.874, meltingPoint: 1811, boilingPoint: 3134, oxidationStates: '+2, +3', state: 'solid', yearDiscovered: 'Ancient', row: 4, col: 8 },
  { atomicNumber: 27, symbol: 'Co', name: 'Cobalt', atomicMass: 58.933, category: 'transition-metal', group: 9, period: 4, block: 'd', electronConfiguration: '[Ar] 3d⁷ 4s²', electronegativity: 1.88, density: 8.86, meltingPoint: 1768, boilingPoint: 3200, oxidationStates: '+2, +3', state: 'solid', yearDiscovered: '1735', row: 4, col: 9 },
  { atomicNumber: 28, symbol: 'Ni', name: 'Nickel', atomicMass: 58.693, category: 'transition-metal', group: 10, period: 4, block: 'd', electronConfiguration: '[Ar] 3d⁸ 4s²', electronegativity: 1.91, density: 8.912, meltingPoint: 1728, boilingPoint: 3186, oxidationStates: '+2, +3', state: 'solid', yearDiscovered: '1751', row: 4, col: 10 },
  { atomicNumber: 29, symbol: 'Cu', name: 'Copper', atomicMass: 63.546, category: 'transition-metal', group: 11, period: 4, block: 'd', electronConfiguration: '[Ar] 3d¹⁰ 4s¹', electronegativity: 1.90, density: 8.96, meltingPoint: 1357.77, boilingPoint: 2835, oxidationStates: '+1, +2', state: 'solid', yearDiscovered: 'Ancient', row: 4, col: 11 },
  { atomicNumber: 30, symbol: 'Zn', name: 'Zinc', atomicMass: 65.38, category: 'transition-metal', group: 12, period: 4, block: 'd', electronConfiguration: '[Ar] 3d¹⁰ 4s²', electronegativity: 1.65, density: 7.134, meltingPoint: 692.88, boilingPoint: 1180, oxidationStates: '+2', state: 'solid', yearDiscovered: 'Ancient', row: 4, col: 12 },
  { atomicNumber: 31, symbol: 'Ga', name: 'Gallium', atomicMass: 69.723, category: 'post-transition-metal', group: 13, period: 4, block: 'p', electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p¹', electronegativity: 1.81, density: 5.907, meltingPoint: 302.91, boilingPoint: 2477, oxidationStates: '+3', state: 'solid', yearDiscovered: '1875', row: 4, col: 13 },
  { atomicNumber: 32, symbol: 'Ge', name: 'Germanium', atomicMass: 72.64, category: 'metalloid', group: 14, period: 4, block: 'p', electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p²', electronegativity: 2.01, density: 5.323, meltingPoint: 1211.40, boilingPoint: 3106, oxidationStates: '+2, +4', state: 'solid', yearDiscovered: '1886', row: 4, col: 14 },
  { atomicNumber: 33, symbol: 'As', name: 'Arsenic', atomicMass: 74.922, category: 'metalloid', group: 15, period: 4, block: 'p', electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p³', electronegativity: 2.18, density: 5.776, meltingPoint: 1090, boilingPoint: 887, oxidationStates: '-3, +3, +5', state: 'solid', yearDiscovered: 'Ancient', row: 4, col: 15 },
  { atomicNumber: 34, symbol: 'Se', name: 'Selenium', atomicMass: 78.96, category: 'nonmetal', group: 16, period: 4, block: 'p', electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p⁴', electronegativity: 2.55, density: 4.809, meltingPoint: 494, boilingPoint: 958, oxidationStates: '-2, +4, +6', state: 'solid', yearDiscovered: '1817', row: 4, col: 16 },
  { atomicNumber: 35, symbol: 'Br', name: 'Bromine', atomicMass: 79.904, category: 'halogen', group: 17, period: 4, block: 'p', electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p⁵', electronegativity: 2.96, density: 3.122, meltingPoint: 265.8, boilingPoint: 332, oxidationStates: '-1, +1, +5', state: 'liquid', yearDiscovered: '1826', row: 4, col: 17 },
  { atomicNumber: 36, symbol: 'Kr', name: 'Krypton', atomicMass: 83.798, category: 'noble-gas', group: 18, period: 4, block: 'p', electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p⁶', electronegativity: 3.00, density: 0.0037, meltingPoint: 115.79, boilingPoint: 119.93, oxidationStates: '0', state: 'gas', yearDiscovered: '1898', row: 4, col: 18 },

  // Period 5
  { atomicNumber: 37, symbol: 'Rb', name: 'Rubidium', atomicMass: 85.468, category: 'alkali-metal', group: 1, period: 5, block: 's', electronConfiguration: '[Kr] 5s¹', electronegativity: 0.82, density: 1.532, meltingPoint: 312.46, boilingPoint: 961, oxidationStates: '+1', state: 'solid', yearDiscovered: '1861', row: 5, col: 1 },
  { atomicNumber: 38, symbol: 'Sr', name: 'Strontium', atomicMass: 87.62, category: 'alkaline-earth', group: 2, period: 5, block: 's', electronConfiguration: '[Kr] 5s²', electronegativity: 0.95, density: 2.64, meltingPoint: 1050, boilingPoint: 1655, oxidationStates: '+2', state: 'solid', yearDiscovered: '1790', row: 5, col: 2 },
  { atomicNumber: 39, symbol: 'Y', name: 'Yttrium', atomicMass: 88.906, category: 'transition-metal', group: 3, period: 5, block: 'd', electronConfiguration: '[Kr] 4d¹ 5s²', electronegativity: 1.22, density: 4.469, meltingPoint: 1799, boilingPoint: 3609, oxidationStates: '+3', state: 'solid', yearDiscovered: '1794', row: 5, col: 3 },
  { atomicNumber: 40, symbol: 'Zr', name: 'Zirconium', atomicMass: 91.224, category: 'transition-metal', group: 4, period: 5, block: 'd', electronConfiguration: '[Kr] 4d² 5s²', electronegativity: 1.33, density: 6.506, meltingPoint: 2128, boilingPoint: 4682, oxidationStates: '+4', state: 'solid', yearDiscovered: '1789', row: 5, col: 4 },
  { atomicNumber: 41, symbol: 'Nb', name: 'Niobium', atomicMass: 92.906, category: 'transition-metal', group: 5, period: 5, block: 'd', electronConfiguration: '[Kr] 4d⁴ 5s¹', electronegativity: 1.6, density: 8.57, meltingPoint: 2750, boilingPoint: 5017, oxidationStates: '+3, +5', state: 'solid', yearDiscovered: '1801', row: 5, col: 5 },
  { atomicNumber: 42, symbol: 'Mo', name: 'Molybdenum', atomicMass: 95.96, category: 'transition-metal', group: 6, period: 5, block: 'd', electronConfiguration: '[Kr] 4d⁵ 5s¹', electronegativity: 2.16, density: 10.22, meltingPoint: 2896, boilingPoint: 4912, oxidationStates: '+4, +6', state: 'solid', yearDiscovered: '1781', row: 5, col: 6 },
  { atomicNumber: 43, symbol: 'Tc', name: 'Technetium', atomicMass: 98, category: 'transition-metal', group: 7, period: 5, block: 'd', electronConfiguration: '[Kr] 4d⁵ 5s²', electronegativity: 1.9, density: 11.5, meltingPoint: 2430, boilingPoint: 4538, oxidationStates: '+4, +7', state: 'solid', yearDiscovered: '1937', row: 5, col: 7 },
  { atomicNumber: 44, symbol: 'Ru', name: 'Ruthenium', atomicMass: 101.07, category: 'transition-metal', group: 8, period: 5, block: 'd', electronConfiguration: '[Kr] 4d⁷ 5s¹', electronegativity: 2.2, density: 12.37, meltingPoint: 2607, boilingPoint: 4423, oxidationStates: '+3, +4', state: 'solid', yearDiscovered: '1844', row: 5, col: 8 },
  { atomicNumber: 45, symbol: 'Rh', name: 'Rhodium', atomicMass: 102.906, category: 'transition-metal', group: 9, period: 5, block: 'd', electronConfiguration: '[Kr] 4d⁸ 5s¹', electronegativity: 2.28, density: 12.41, meltingPoint: 2237, boilingPoint: 3968, oxidationStates: '+3', state: 'solid', yearDiscovered: '1803', row: 5, col: 9 },
  { atomicNumber: 46, symbol: 'Pd', name: 'Palladium', atomicMass: 106.42, category: 'transition-metal', group: 10, period: 5, block: 'd', electronConfiguration: '[Kr] 4d¹⁰', electronegativity: 2.20, density: 12.02, meltingPoint: 1828.05, boilingPoint: 3236, oxidationStates: '+2, +4', state: 'solid', yearDiscovered: '1803', row: 5, col: 10 },
  { atomicNumber: 47, symbol: 'Ag', name: 'Silver', atomicMass: 107.868, category: 'transition-metal', group: 11, period: 5, block: 'd', electronConfiguration: '[Kr] 4d¹⁰ 5s¹', electronegativity: 1.93, density: 10.501, meltingPoint: 1234.93, boilingPoint: 2435, oxidationStates: '+1', state: 'solid', yearDiscovered: 'Ancient', row: 5, col: 11 },
  { atomicNumber: 48, symbol: 'Cd', name: 'Cadmium', atomicMass: 112.411, category: 'transition-metal', group: 12, period: 5, block: 'd', electronConfiguration: '[Kr] 4d¹⁰ 5s²', electronegativity: 1.69, density: 8.69, meltingPoint: 594.22, boilingPoint: 1040, oxidationStates: '+2', state: 'solid', yearDiscovered: '1817', row: 5, col: 12 },
  { atomicNumber: 49, symbol: 'In', name: 'Indium', atomicMass: 114.818, category: 'post-transition-metal', group: 13, period: 5, block: 'p', electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p¹', electronegativity: 1.78, density: 7.31, meltingPoint: 429.75, boilingPoint: 2345, oxidationStates: '+3', state: 'solid', yearDiscovered: '1863', row: 5, col: 13 },
  { atomicNumber: 50, symbol: 'Sn', name: 'Tin', atomicMass: 118.710, category: 'post-transition-metal', group: 14, period: 5, block: 'p', electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p²', electronegativity: 1.96, density: 7.287, meltingPoint: 505.08, boilingPoint: 2875, oxidationStates: '+2, +4', state: 'solid', yearDiscovered: 'Ancient', row: 5, col: 14 },
  { atomicNumber: 51, symbol: 'Sb', name: 'Antimony', atomicMass: 121.760, category: 'metalloid', group: 15, period: 5, block: 'p', electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p³', electronegativity: 2.05, density: 6.685, meltingPoint: 903.78, boilingPoint: 1860, oxidationStates: '-3, +3, +5', state: 'solid', yearDiscovered: 'Ancient', row: 5, col: 15 },
  { atomicNumber: 52, symbol: 'Te', name: 'Tellurium', atomicMass: 127.60, category: 'metalloid', group: 16, period: 5, block: 'p', electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p⁴', electronegativity: 2.1, density: 6.232, meltingPoint: 722.66, boilingPoint: 1261, oxidationStates: '-2, +4, +6', state: 'solid', yearDiscovered: '1783', row: 5, col: 16 },
  { atomicNumber: 53, symbol: 'I', name: 'Iodine', atomicMass: 126.904, category: 'halogen', group: 17, period: 5, block: 'p', electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p⁵', electronegativity: 2.66, density: 4.93, meltingPoint: 386.85, boilingPoint: 457.4, oxidationStates: '-1, +1, +5, +7', state: 'solid', yearDiscovered: '1811', row: 5, col: 17 },
  { atomicNumber: 54, symbol: 'Xe', name: 'Xenon', atomicMass: 131.293, category: 'noble-gas', group: 18, period: 5, block: 'p', electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p⁶', electronegativity: 2.60, density: 0.0059, meltingPoint: 161.4, boilingPoint: 165.03, oxidationStates: '0, +2', state: 'gas', yearDiscovered: '1898', row: 5, col: 18 },

  // Period 6
  { atomicNumber: 55, symbol: 'Cs', name: 'Caesium', atomicMass: 132.905, category: 'alkali-metal', group: 1, period: 6, block: 's', electronConfiguration: '[Xe] 6s¹', electronegativity: 0.79, density: 1.873, meltingPoint: 301.59, boilingPoint: 944, oxidationStates: '+1', state: 'solid', yearDiscovered: '1860', row: 6, col: 1 },
  { atomicNumber: 56, symbol: 'Ba', name: 'Barium', atomicMass: 137.327, category: 'alkaline-earth', group: 2, period: 6, block: 's', electronConfiguration: '[Xe] 6s²', electronegativity: 0.89, density: 3.594, meltingPoint: 1000, boilingPoint: 2170, oxidationStates: '+2', state: 'solid', yearDiscovered: '1808', row: 6, col: 2 },
  // Lanthanides (57-71) → row 9
  { atomicNumber: 57, symbol: 'La', name: 'Lanthanum', atomicMass: 138.905, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 5d¹ 6s²', electronegativity: 1.10, density: 6.145, meltingPoint: 1193, boilingPoint: 3737, oxidationStates: '+3', state: 'solid', yearDiscovered: '1839', row: 9, col: 3 },
  { atomicNumber: 58, symbol: 'Ce', name: 'Cerium', atomicMass: 140.116, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f¹ 5d¹ 6s²', electronegativity: 1.12, density: 6.77, meltingPoint: 1068, boilingPoint: 3716, oxidationStates: '+3, +4', state: 'solid', yearDiscovered: '1803', row: 9, col: 4 },
  { atomicNumber: 59, symbol: 'Pr', name: 'Praseodymium', atomicMass: 140.908, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f³ 6s²', electronegativity: 1.13, density: 6.773, meltingPoint: 1208, boilingPoint: 3793, oxidationStates: '+3', state: 'solid', yearDiscovered: '1885', row: 9, col: 5 },
  { atomicNumber: 60, symbol: 'Nd', name: 'Neodymium', atomicMass: 144.242, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f⁴ 6s²', electronegativity: 1.14, density: 7.007, meltingPoint: 1297, boilingPoint: 3347, oxidationStates: '+3', state: 'solid', yearDiscovered: '1885', row: 9, col: 6 },
  { atomicNumber: 61, symbol: 'Pm', name: 'Promethium', atomicMass: 145, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f⁵ 6s²', electronegativity: 1.13, density: 7.26, meltingPoint: 1315, boilingPoint: 3273, oxidationStates: '+3', state: 'solid', yearDiscovered: '1945', row: 9, col: 7 },
  { atomicNumber: 62, symbol: 'Sm', name: 'Samarium', atomicMass: 150.36, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f⁶ 6s²', electronegativity: 1.17, density: 7.52, meltingPoint: 1345, boilingPoint: 2067, oxidationStates: '+2, +3', state: 'solid', yearDiscovered: '1879', row: 9, col: 8 },
  { atomicNumber: 63, symbol: 'Eu', name: 'Europium', atomicMass: 151.964, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f⁷ 6s²', electronegativity: 1.2, density: 5.243, meltingPoint: 1099, boilingPoint: 1802, oxidationStates: '+2, +3', state: 'solid', yearDiscovered: '1901', row: 9, col: 9 },
  { atomicNumber: 64, symbol: 'Gd', name: 'Gadolinium', atomicMass: 157.25, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f⁷ 5d¹ 6s²', electronegativity: 1.20, density: 7.895, meltingPoint: 1585, boilingPoint: 3546, oxidationStates: '+3', state: 'solid', yearDiscovered: '1880', row: 9, col: 10 },
  { atomicNumber: 65, symbol: 'Tb', name: 'Terbium', atomicMass: 158.925, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f⁹ 6s²', electronegativity: 1.2, density: 8.229, meltingPoint: 1629, boilingPoint: 3503, oxidationStates: '+3', state: 'solid', yearDiscovered: '1843', row: 9, col: 11 },
  { atomicNumber: 66, symbol: 'Dy', name: 'Dysprosium', atomicMass: 162.500, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f¹⁰ 6s²', electronegativity: 1.22, density: 8.55, meltingPoint: 1680, boilingPoint: 2840, oxidationStates: '+3', state: 'solid', yearDiscovered: '1886', row: 9, col: 12 },
  { atomicNumber: 67, symbol: 'Ho', name: 'Holmium', atomicMass: 164.930, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f¹¹ 6s²', electronegativity: 1.23, density: 8.795, meltingPoint: 1734, boilingPoint: 2993, oxidationStates: '+3', state: 'solid', yearDiscovered: '1878', row: 9, col: 13 },
  { atomicNumber: 68, symbol: 'Er', name: 'Erbium', atomicMass: 167.259, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f¹² 6s²', electronegativity: 1.24, density: 9.066, meltingPoint: 1802, boilingPoint: 3141, oxidationStates: '+3', state: 'solid', yearDiscovered: '1842', row: 9, col: 14 },
  { atomicNumber: 69, symbol: 'Tm', name: 'Thulium', atomicMass: 168.934, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f¹³ 6s²', electronegativity: 1.25, density: 9.321, meltingPoint: 1818, boilingPoint: 2223, oxidationStates: '+3', state: 'solid', yearDiscovered: '1879', row: 9, col: 15 },
  { atomicNumber: 70, symbol: 'Yb', name: 'Ytterbium', atomicMass: 173.054, category: 'lanthanide', group: null, period: 6, block: 'f', electronConfiguration: '[Xe] 4f¹⁴ 6s²', electronegativity: 1.1, density: 6.965, meltingPoint: 1097, boilingPoint: 1469, oxidationStates: '+2, +3', state: 'solid', yearDiscovered: '1878', row: 9, col: 16 },
  { atomicNumber: 71, symbol: 'Lu', name: 'Lutetium', atomicMass: 174.967, category: 'lanthanide', group: null, period: 6, block: 'd', electronConfiguration: '[Xe] 4f¹⁴ 5d¹ 6s²', electronegativity: 1.27, density: 9.84, meltingPoint: 1925, boilingPoint: 3675, oxidationStates: '+3', state: 'solid', yearDiscovered: '1907', row: 9, col: 17 },
  // Continue Period 6 main
  { atomicNumber: 72, symbol: 'Hf', name: 'Hafnium', atomicMass: 178.49, category: 'transition-metal', group: 4, period: 6, block: 'd', electronConfiguration: '[Xe] 4f¹⁴ 5d² 6s²', electronegativity: 1.3, density: 13.31, meltingPoint: 2506, boilingPoint: 4876, oxidationStates: '+4', state: 'solid', yearDiscovered: '1923', row: 6, col: 4 },
  { atomicNumber: 73, symbol: 'Ta', name: 'Tantalum', atomicMass: 180.948, category: 'transition-metal', group: 5, period: 6, block: 'd', electronConfiguration: '[Xe] 4f¹⁴ 5d³ 6s²', electronegativity: 1.5, density: 16.654, meltingPoint: 3290, boilingPoint: 5731, oxidationStates: '+5', state: 'solid', yearDiscovered: '1802', row: 6, col: 5 },
  { atomicNumber: 74, symbol: 'W', name: 'Tungsten', atomicMass: 183.84, category: 'transition-metal', group: 6, period: 6, block: 'd', electronConfiguration: '[Xe] 4f¹⁴ 5d⁴ 6s²', electronegativity: 2.36, density: 19.25, meltingPoint: 3695, boilingPoint: 5828, oxidationStates: '+4, +6', state: 'solid', yearDiscovered: '1783', row: 6, col: 6 },
  { atomicNumber: 75, symbol: 'Re', name: 'Rhenium', atomicMass: 186.207, category: 'transition-metal', group: 7, period: 6, block: 'd', electronConfiguration: '[Xe] 4f¹⁴ 5d⁵ 6s²', electronegativity: 1.9, density: 21.02, meltingPoint: 3459, boilingPoint: 5869, oxidationStates: '+4, +7', state: 'solid', yearDiscovered: '1925', row: 6, col: 7 },
  { atomicNumber: 76, symbol: 'Os', name: 'Osmium', atomicMass: 190.23, category: 'transition-metal', group: 8, period: 6, block: 'd', electronConfiguration: '[Xe] 4f¹⁴ 5d⁶ 6s²', electronegativity: 2.2, density: 22.59, meltingPoint: 3306, boilingPoint: 5285, oxidationStates: '+3, +4', state: 'solid', yearDiscovered: '1803', row: 6, col: 8 },
  { atomicNumber: 77, symbol: 'Ir', name: 'Iridium', atomicMass: 192.217, category: 'transition-metal', group: 9, period: 6, block: 'd', electronConfiguration: '[Xe] 4f¹⁴ 5d⁷ 6s²', electronegativity: 2.20, density: 22.56, meltingPoint: 2719, boilingPoint: 4701, oxidationStates: '+3, +4', state: 'solid', yearDiscovered: '1803', row: 6, col: 9 },
  { atomicNumber: 78, symbol: 'Pt', name: 'Platinum', atomicMass: 195.084, category: 'transition-metal', group: 10, period: 6, block: 'd', electronConfiguration: '[Xe] 4f¹⁴ 5d⁹ 6s¹', electronegativity: 2.28, density: 21.46, meltingPoint: 2041.4, boilingPoint: 4098, oxidationStates: '+2, +4', state: 'solid', yearDiscovered: '1735', row: 6, col: 10 },
  { atomicNumber: 79, symbol: 'Au', name: 'Gold', atomicMass: 196.967, category: 'transition-metal', group: 11, period: 6, block: 'd', electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', electronegativity: 2.54, density: 19.282, meltingPoint: 1337.33, boilingPoint: 3129, oxidationStates: '+1, +3', state: 'solid', yearDiscovered: 'Ancient', row: 6, col: 11 },
  { atomicNumber: 80, symbol: 'Hg', name: 'Mercury', atomicMass: 200.59, category: 'transition-metal', group: 12, period: 6, block: 'd', electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', electronegativity: 2.00, density: 13.5336, meltingPoint: 234.43, boilingPoint: 629.88, oxidationStates: '+1, +2', state: 'liquid', yearDiscovered: 'Ancient', row: 6, col: 12 },
  { atomicNumber: 81, symbol: 'Tl', name: 'Thallium', atomicMass: 204.383, category: 'post-transition-metal', group: 13, period: 6, block: 'p', electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', electronegativity: 1.62, density: 11.85, meltingPoint: 577, boilingPoint: 1746, oxidationStates: '+1, +3', state: 'solid', yearDiscovered: '1861', row: 6, col: 13 },
  { atomicNumber: 82, symbol: 'Pb', name: 'Lead', atomicMass: 207.2, category: 'post-transition-metal', group: 14, period: 6, block: 'p', electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', electronegativity: 2.33, density: 11.342, meltingPoint: 600.61, boilingPoint: 2022, oxidationStates: '+2, +4', state: 'solid', yearDiscovered: 'Ancient', row: 6, col: 14 },
  { atomicNumber: 83, symbol: 'Bi', name: 'Bismuth', atomicMass: 208.980, category: 'post-transition-metal', group: 15, period: 6, block: 'p', electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', electronegativity: 2.02, density: 9.807, meltingPoint: 544.7, boilingPoint: 1837, oxidationStates: '+3, +5', state: 'solid', yearDiscovered: 'Ancient', row: 6, col: 15 },
  { atomicNumber: 84, symbol: 'Po', name: 'Polonium', atomicMass: 209, category: 'post-transition-metal', group: 16, period: 6, block: 'p', electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', electronegativity: 2.0, density: 9.32, meltingPoint: 527, boilingPoint: 1235, oxidationStates: '+2, +4', state: 'solid', yearDiscovered: '1898', row: 6, col: 16 },
  { atomicNumber: 85, symbol: 'At', name: 'Astatine', atomicMass: 210, category: 'halogen', group: 17, period: 6, block: 'p', electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', electronegativity: 2.2, density: 7, meltingPoint: 575, boilingPoint: 610, oxidationStates: '-1, +1', state: 'solid', yearDiscovered: '1940', row: 6, col: 17 },
  { atomicNumber: 86, symbol: 'Rn', name: 'Radon', atomicMass: 222, category: 'noble-gas', group: 18, period: 6, block: 'p', electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', electronegativity: null, density: 0.00973, meltingPoint: 202, boilingPoint: 211.3, oxidationStates: '0', state: 'gas', yearDiscovered: '1900', row: 6, col: 18 },

  // Period 7
  { atomicNumber: 87, symbol: 'Fr', name: 'Francium', atomicMass: 223, category: 'alkali-metal', group: 1, period: 7, block: 's', electronConfiguration: '[Rn] 7s¹', electronegativity: 0.7, density: 1.87, meltingPoint: 300, boilingPoint: 950, oxidationStates: '+1', state: 'solid', yearDiscovered: '1939', row: 7, col: 1 },
  { atomicNumber: 88, symbol: 'Ra', name: 'Radium', atomicMass: 226, category: 'alkaline-earth', group: 2, period: 7, block: 's', electronConfiguration: '[Rn] 7s²', electronegativity: 0.9, density: 5.5, meltingPoint: 973, boilingPoint: 2010, oxidationStates: '+2', state: 'solid', yearDiscovered: '1898', row: 7, col: 2 },
  // Actinides (89-103) → row 10
  { atomicNumber: 89, symbol: 'Ac', name: 'Actinium', atomicMass: 227, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 6d¹ 7s²', electronegativity: 1.1, density: 10.07, meltingPoint: 1323, boilingPoint: 3471, oxidationStates: '+3', state: 'solid', yearDiscovered: '1899', row: 10, col: 3 },
  { atomicNumber: 90, symbol: 'Th', name: 'Thorium', atomicMass: 232.038, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 6d² 7s²', electronegativity: 1.3, density: 11.72, meltingPoint: 2115, boilingPoint: 5061, oxidationStates: '+4', state: 'solid', yearDiscovered: '1829', row: 10, col: 4 },
  { atomicNumber: 91, symbol: 'Pa', name: 'Protactinium', atomicMass: 231.036, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f² 6d¹ 7s²', electronegativity: 1.5, density: 15.37, meltingPoint: 1841, boilingPoint: 4300, oxidationStates: '+4, +5', state: 'solid', yearDiscovered: '1913', row: 10, col: 5 },
  { atomicNumber: 92, symbol: 'U', name: 'Uranium', atomicMass: 238.029, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f³ 6d¹ 7s²', electronegativity: 1.38, density: 18.95, meltingPoint: 1405.3, boilingPoint: 4404, oxidationStates: '+3, +4, +5, +6', state: 'solid', yearDiscovered: '1789', row: 10, col: 6 },
  { atomicNumber: 93, symbol: 'Np', name: 'Neptunium', atomicMass: 237, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f⁴ 6d¹ 7s²', electronegativity: 1.36, density: 20.45, meltingPoint: 917, boilingPoint: 4273, oxidationStates: '+3, +4, +5', state: 'solid', yearDiscovered: '1940', row: 10, col: 7 },
  { atomicNumber: 94, symbol: 'Pu', name: 'Plutonium', atomicMass: 244, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f⁶ 7s²', electronegativity: 1.28, density: 19.84, meltingPoint: 912.5, boilingPoint: 3501, oxidationStates: '+3, +4, +5, +6', state: 'solid', yearDiscovered: '1940', row: 10, col: 8 },
  { atomicNumber: 95, symbol: 'Am', name: 'Americium', atomicMass: 243, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f⁷ 7s²', electronegativity: 1.3, density: 13.69, meltingPoint: 1449, boilingPoint: 2880, oxidationStates: '+3, +4', state: 'solid', yearDiscovered: '1944', row: 10, col: 9 },
  { atomicNumber: 96, symbol: 'Cm', name: 'Curium', atomicMass: 247, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f⁷ 6d¹ 7s²', electronegativity: 1.3, density: 13.51, meltingPoint: 1613, boilingPoint: 3383, oxidationStates: '+3', state: 'solid', yearDiscovered: '1944', row: 10, col: 10 },
  { atomicNumber: 97, symbol: 'Bk', name: 'Berkelium', atomicMass: 247, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f⁹ 7s²', electronegativity: 1.3, density: 14.79, meltingPoint: 1259, boilingPoint: 2900, oxidationStates: '+3, +4', state: 'solid', yearDiscovered: '1949', row: 10, col: 11 },
  { atomicNumber: 98, symbol: 'Cf', name: 'Californium', atomicMass: 251, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f¹⁰ 7s²', electronegativity: 1.3, density: 15.1, meltingPoint: 1173, boilingPoint: 1743, oxidationStates: '+3', state: 'solid', yearDiscovered: '1950', row: 10, col: 12 },
  { atomicNumber: 99, symbol: 'Es', name: 'Einsteinium', atomicMass: 252, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f¹¹ 7s²', electronegativity: 1.3, density: 8.84, meltingPoint: 1133, boilingPoint: 1269, oxidationStates: '+3', state: 'solid', yearDiscovered: '1952', row: 10, col: 13 },
  { atomicNumber: 100, symbol: 'Fm', name: 'Fermium', atomicMass: 257, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f¹² 7s²', electronegativity: 1.3, density: null, meltingPoint: 1800, boilingPoint: null, oxidationStates: '+3', state: 'solid', yearDiscovered: '1952', row: 10, col: 14 },
  { atomicNumber: 101, symbol: 'Md', name: 'Mendelevium', atomicMass: 258, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f¹³ 7s²', electronegativity: 1.3, density: null, meltingPoint: 1100, boilingPoint: null, oxidationStates: '+2, +3', state: 'solid', yearDiscovered: '1955', row: 10, col: 15 },
  { atomicNumber: 102, symbol: 'No', name: 'Nobelium', atomicMass: 259, category: 'actinide', group: null, period: 7, block: 'f', electronConfiguration: '[Rn] 5f¹⁴ 7s²', electronegativity: 1.3, density: null, meltingPoint: 1100, boilingPoint: null, oxidationStates: '+2, +3', state: 'solid', yearDiscovered: '1958', row: 10, col: 16 },
  { atomicNumber: 103, symbol: 'Lr', name: 'Lawrencium', atomicMass: 262, category: 'actinide', group: null, period: 7, block: 'd', electronConfiguration: '[Rn] 5f¹⁴ 7s² 7p¹', electronegativity: 1.3, density: null, meltingPoint: 1900, boilingPoint: null, oxidationStates: '+3', state: 'solid', yearDiscovered: '1961', row: 10, col: 17 },
  // Continue Period 7 main
  { atomicNumber: 104, symbol: 'Rf', name: 'Rutherfordium', atomicMass: 267, category: 'transition-metal', group: 4, period: 7, block: 'd', electronConfiguration: '[Rn] 5f¹⁴ 6d² 7s²', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+4', state: 'solid', yearDiscovered: '1964', row: 7, col: 4 },
  { atomicNumber: 105, symbol: 'Db', name: 'Dubnium', atomicMass: 268, category: 'transition-metal', group: 5, period: 7, block: 'd', electronConfiguration: '[Rn] 5f¹⁴ 6d³ 7s²', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+5', state: 'solid', yearDiscovered: '1967', row: 7, col: 5 },
  { atomicNumber: 106, symbol: 'Sg', name: 'Seaborgium', atomicMass: 271, category: 'transition-metal', group: 6, period: 7, block: 'd', electronConfiguration: '[Rn] 5f¹⁴ 6d⁴ 7s²', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+6', state: 'solid', yearDiscovered: '1974', row: 7, col: 6 },
  { atomicNumber: 107, symbol: 'Bh', name: 'Bohrium', atomicMass: 272, category: 'transition-metal', group: 7, period: 7, block: 'd', electronConfiguration: '[Rn] 5f¹⁴ 6d⁵ 7s²', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+7', state: 'solid', yearDiscovered: '1981', row: 7, col: 7 },
  { atomicNumber: 108, symbol: 'Hs', name: 'Hassium', atomicMass: 270, category: 'transition-metal', group: 8, period: 7, block: 'd', electronConfiguration: '[Rn] 5f¹⁴ 6d⁶ 7s²', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+8', state: 'solid', yearDiscovered: '1984', row: 7, col: 8 },
  { atomicNumber: 109, symbol: 'Mt', name: 'Meitnerium', atomicMass: 276, category: 'transition-metal', group: 9, period: 7, block: 'd', electronConfiguration: '[Rn] 5f¹⁴ 6d⁷ 7s²', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+3, +4', state: 'solid', yearDiscovered: '1982', row: 7, col: 9 },
  { atomicNumber: 110, symbol: 'Ds', name: 'Darmstadtium', atomicMass: 281, category: 'transition-metal', group: 10, period: 7, block: 'd', electronConfiguration: '[Rn] 5f¹⁴ 6d⁸ 7s²', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+2', state: 'solid', yearDiscovered: '1994', row: 7, col: 10 },
  { atomicNumber: 111, symbol: 'Rg', name: 'Roentgenium', atomicMass: 280, category: 'transition-metal', group: 11, period: 7, block: 'd', electronConfiguration: '[Rn] 5f¹⁴ 6d⁹ 7s²', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+3', state: 'solid', yearDiscovered: '1994', row: 7, col: 11 },
  { atomicNumber: 112, symbol: 'Cn', name: 'Copernicium', atomicMass: 285, category: 'transition-metal', group: 12, period: 7, block: 'd', electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s²', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+2', state: 'solid', yearDiscovered: '1996', row: 7, col: 12 },
  { atomicNumber: 113, symbol: 'Nh', name: 'Nihonium', atomicMass: 286, category: 'post-transition-metal', group: 13, period: 7, block: 'p', electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+1', state: 'solid', yearDiscovered: '2003', row: 7, col: 13 },
  { atomicNumber: 114, symbol: 'Fl', name: 'Flerovium', atomicMass: 289, category: 'post-transition-metal', group: 14, period: 7, block: 'p', electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+2', state: 'solid', yearDiscovered: '1998', row: 7, col: 14 },
  { atomicNumber: 115, symbol: 'Mc', name: 'Moscovium', atomicMass: 290, category: 'post-transition-metal', group: 15, period: 7, block: 'p', electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+1, +3', state: 'solid', yearDiscovered: '2003', row: 7, col: 15 },
  { atomicNumber: 116, symbol: 'Lv', name: 'Livermorium', atomicMass: 293, category: 'post-transition-metal', group: 16, period: 7, block: 'p', electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '+2', state: 'solid', yearDiscovered: '2000', row: 7, col: 16 },
  { atomicNumber: 117, symbol: 'Ts', name: 'Tennessine', atomicMass: 294, category: 'halogen', group: 17, period: 7, block: 'p', electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '-1, +1', state: 'solid', yearDiscovered: '2010', row: 7, col: 17 },
  { atomicNumber: 118, symbol: 'Og', name: 'Oganesson', atomicMass: 294, category: 'noble-gas', group: 18, period: 7, block: 'p', electronConfiguration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', electronegativity: null, density: null, meltingPoint: null, boilingPoint: null, oxidationStates: '0', state: 'solid', yearDiscovered: '2002', row: 7, col: 18 },
];

// Parse a chemical formula into element counts, e.g. "H2SO4" → {H:2, S:1, O:4}
export function parseFormula(formula: string): Record<string, number> {
  const result: Record<string, number> = {};
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(formula)) !== null) {
    if (!match[1]) continue;
    const symbol = match[1];
    const count = match[2] ? parseInt(match[2]) : 1;
    result[symbol] = (result[symbol] || 0) + count;
  }
  return result;
}

// Calculate molar mass from formula string
export function calcMolarMass(formula: string): { total: number; breakdown: { symbol: string; name: string; mass: number; count: number }[] } | null {
  const parsed = parseFormula(formula);
  if (Object.keys(parsed).length === 0) return null;

  const breakdown: { symbol: string; name: string; mass: number; count: number }[] = [];
  let total = 0;

  for (const [symbol, count] of Object.entries(parsed)) {
    const el = elements.find(e => e.symbol === symbol);
    if (!el) return null;
    breakdown.push({ symbol, name: el.name, mass: el.atomicMass, count });
    total += el.atomicMass * count;
  }

  return { total, breakdown };
}
