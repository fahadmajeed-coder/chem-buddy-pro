export interface ChemicalCompound {
  srNo: number;
  name: string;
  formula: string;
  molarMass: number | null;
  purity: string;
  purityValue: number | null; // midpoint numeric value for calculations
  density: number | null;
}

function parsePurity(purity: string): number | null {
  if (!purity) return null;
  const rangeMatch = purity.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (rangeMatch) {
    return (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
  }
  const singleMatch = purity.match(/([\d.]+)/);
  if (singleMatch) return parseFloat(singleMatch[1]);
  return null;
}

export const chemicalInventory: ChemicalCompound[] = [
  { srNo: 1, name: "Copper II Sulphate Penta Hydrate", formula: "CuSO4·5H2O", molarMass: 249.69, purity: "99-102%", purityValue: parsePurity("99-102%"), density: 2.284 },
  { srNo: 2, name: "Sodium Tetra Phenyl Borate", formula: "NaB(C6H5)4", molarMass: 342.22, purity: "99.50%", purityValue: parsePurity("99.50%"), density: null },
  { srNo: 3, name: "Sodium Acetate Trihydrate", formula: "CH3COONa·3H2O", molarMass: 136.08, purity: "99-101%", purityValue: parsePurity("99-101%"), density: null },
  { srNo: 4, name: "Pepsin", formula: "", molarMass: null, purity: "", purityValue: null, density: null },
  { srNo: 5, name: "Tri Chloro Acetic Acid", formula: "CCl3COOH", molarMass: 163.39, purity: "99-99.5%", purityValue: parsePurity("99-99.5%"), density: null },
  { srNo: 6, name: "Potassium Dihydrogen Phosphate", formula: "KH2PO4", molarMass: 136.09, purity: "99.5-100.5%", purityValue: parsePurity("99.5-100.5%"), density: null },
  { srNo: 7, name: "Ammonium Meta Vanadate", formula: "NH4VO3", molarMass: 116.98, purity: "99.00%", purityValue: parsePurity("99.00%"), density: 2.32 },
  { srNo: 8, name: "Potassium Chromate", formula: "K2CrO4", molarMass: 194.19, purity: "99.50%", purityValue: parsePurity("99.50%"), density: null },
  { srNo: 9, name: "Di Potassium Hydrogen Phosphate", formula: "K2HPO4", molarMass: 228.22, purity: "", purityValue: null, density: null },
  { srNo: 10, name: "Boric Acid", formula: "H3BO3", molarMass: 61.83, purity: "99.50%", purityValue: parsePurity("99.50%"), density: 1.49 },
  { srNo: 11, name: "Potassium Ferrocyanide Trihydrate", formula: "K4[Fe(CN)6]·3H2O", molarMass: 422.43, purity: "98.00%", purityValue: parsePurity("98.00%"), density: null },
  { srNo: 12, name: "EDTA Disodium Salt Dihydrate", formula: "C10H14N2Na2O8·2H2O", molarMass: 372.24, purity: "98.5-101%", purityValue: parsePurity("98.5-101%"), density: null },
  { srNo: 13, name: "Zinc Oxide", formula: "ZnO", molarMass: 81.39, purity: "99-100.5%", purityValue: parsePurity("99-100.5%"), density: null },
  { srNo: 14, name: "Urea", formula: "CH4N2O", molarMass: 60.06, purity: "99.50%", purityValue: parsePurity("99.50%"), density: null },
  { srNo: 15, name: "Zinc Granular", formula: "Zn", molarMass: 65.39, purity: "99.90%", purityValue: parsePurity("99.90%"), density: 7.133 },
  { srNo: 16, name: "Ammonium Molybdate Tetrahydrate", formula: "(NH4)6Mo7O24·4H2O", molarMass: 1235.86, purity: "81.0-83.0%", purityValue: parsePurity("81.0-83.0%"), density: null },
  { srNo: 17, name: "Sodium Molybdate Dihydrate", formula: "Na2MoO4·2H2O", molarMass: 241.95, purity: "99.50%", purityValue: parsePurity("99.50%"), density: null },
  { srNo: 18, name: "Potassium Hydroxide Pellets", formula: "KOH", molarMass: 56.11, purity: "85-100.5%", purityValue: parsePurity("85-100.5%"), density: null },
  { srNo: 19, name: "Aluminium Chloride Hexahydrate", formula: "AlCl3·6H2O", molarMass: 241.43, purity: "91-101%", purityValue: parsePurity("91-101%"), density: null },
  { srNo: 20, name: "Sodium Thiosulphate Pentahydrate", formula: "Na2S2O3·5H2O", molarMass: 248.21, purity: "99.50%", purityValue: parsePurity("99.50%"), density: 1.74 },
  { srNo: 21, name: "Starch Soluble", formula: "(C6H10O5)n", molarMass: null, purity: "", purityValue: null, density: null },
  { srNo: 22, name: "Iron II Sulphate Heptahydrate", formula: "FeSO4·7H2O", molarMass: 278.01, purity: "99.5-104.5%", purityValue: parsePurity("99.5-104.5%"), density: 1.898 },
  { srNo: 23, name: "Potassium Iodate", formula: "KIO3", molarMass: 166, purity: "99.90%", purityValue: parsePurity("99.90%"), density: null },
  { srNo: 24, name: "Sodium Carbonate", formula: "Na2CO3", molarMass: 105.99, purity: "", purityValue: null, density: null },
  { srNo: 25, name: "Oxalic Acid Dihydrate", formula: "H2C2O4·2H2O", molarMass: 126, purity: "99.5-102%", purityValue: parsePurity("99.5-102%"), density: null },
  { srNo: 26, name: "Potassium Sulphate", formula: "K2SO4", molarMass: 174.26, purity: "99.00%", purityValue: parsePurity("99.00%"), density: 2.66 },
  { srNo: 27, name: "Sodium Hydroxide", formula: "NaOH", molarMass: 40, purity: "99.00%", purityValue: parsePurity("99.00%"), density: null },
  { srNo: 28, name: "Hydrazine Sulphate", formula: "N2H6SO4", molarMass: 130.12, purity: "", purityValue: null, density: null },
  { srNo: 29, name: "Sodium Citrate Tribasic Dihydrate", formula: "Na3C6H5O7·2H2O", molarMass: 294.1, purity: "99-100.5%", purityValue: parsePurity("99-100.5%"), density: null },
  { srNo: 30, name: "Barium Chloride Dihydrate", formula: "BaCl2·2H2O", molarMass: 244.26, purity: "99.00%", purityValue: parsePurity("99.00%"), density: null },
  { srNo: 31, name: "Propionic Anhydride", formula: "(C2H5CO)2O", molarMass: 130.14, purity: "97.00%", purityValue: parsePurity("97.00%"), density: null },
  { srNo: 32, name: "Orange II Sodium Salt", formula: "C16H11N2NaO4S", molarMass: 350.3, purity: "", purityValue: null, density: null },
  { srNo: 33, name: "Phenol Red", formula: "C19H14O5S", molarMass: 354.38, purity: "", purityValue: null, density: null },
  { srNo: 34, name: "Orange II", formula: "C16H12N2O4S", molarMass: 440.44, purity: "86.00%", purityValue: parsePurity("86.00%"), density: null },
  { srNo: 35, name: "Eriochrome Black T", formula: "C20H12N3NaO7S", molarMass: 461.38, purity: "", purityValue: null, density: null },
  { srNo: 36, name: "Methyl Red", formula: "C15H15N3O2", molarMass: 269.3, purity: "", purityValue: null, density: null },
  { srNo: 37, name: "Methyl Orange", formula: "C14H14N3NaO3S", molarMass: 327.33, purity: "", purityValue: null, density: null },
  { srNo: 38, name: "Murexide", formula: "C8H8N6O6", molarMass: 289.19, purity: "", purityValue: null, density: null },
  { srNo: 39, name: "Silver Nitrate", formula: "AgNO3", molarMass: 169.87, purity: "99.8-100.5%", purityValue: parsePurity("99.8-100.5%"), density: null },
  { srNo: 40, name: "1,5-Diphenyl Carbazide", formula: "C13H12N4O", molarMass: 242.28, purity: "97.00%", purityValue: parsePurity("97.00%"), density: null },
  { srNo: 41, name: "Phenolphthalein", formula: "C20H14O4", molarMass: 318.33, purity: "98-101%", purityValue: parsePurity("98-101%"), density: null },
  { srNo: 42, name: "Ammonium Chloride", formula: "NH4Cl", molarMass: 53.49, purity: "99.50%", purityValue: parsePurity("99.50%"), density: null },
  { srNo: 43, name: "Sulphuric Acid", formula: "H2SO4", molarMass: 98.07, purity: "98.00%", purityValue: parsePurity("98.00%"), density: 1.84 },
  { srNo: 44, name: "Hydrochloric Acid", formula: "HCl", molarMass: 36.46, purity: "37-38%", purityValue: parsePurity("37-38%"), density: 1.18 },
  { srNo: 45, name: "Nitric Acid", formula: "HNO3", molarMass: 63.01, purity: "65.00%", purityValue: parsePurity("65.00%"), density: null },
  { srNo: 46, name: "Chloroform", formula: "CHCl3", molarMass: 119.38, purity: "99-99.4%", purityValue: parsePurity("99-99.4%"), density: 1.48 },
  { srNo: 47, name: "Methyl Alcohol", formula: "CH3OH", molarMass: 32.04, purity: "99.50%", purityValue: parsePurity("99.50%"), density: null },
  { srNo: 48, name: "Acetone", formula: "C3H6O", molarMass: 58.08, purity: "99.00%", purityValue: parsePurity("99.00%"), density: 0.79 },
  { srNo: 49, name: "Ammonium Buffer Solution", formula: "", molarMass: null, purity: "", purityValue: null, density: null },
  { srNo: 50, name: "Acetic Acid", formula: "CH3COOH", molarMass: 60.05, purity: "99-100.5%", purityValue: parsePurity("99-100.5%"), density: null },
  { srNo: 51, name: "Silica Gel Blue", formula: "SiO2·nH2O", molarMass: null, purity: "", purityValue: null, density: null },
  { srNo: 52, name: "Zinc Acetate Dihydrate", formula: "Zn(CH3COO)2·2H2O", molarMass: 219.51, purity: "", purityValue: null, density: null },
  { srNo: 53, name: "Hexadecyl Trimethyl Ammonium Bromide", formula: "C19H42BrN", molarMass: 364.45, purity: "96.00%", purityValue: parsePurity("96.00%"), density: null },
  { srNo: 54, name: "Potassium Chloride", formula: "KCl", molarMass: 74.55, purity: "99.00%", purityValue: parsePurity("99.00%"), density: null },
  { srNo: 55, name: "Sodium Chloride", formula: "NaCl", molarMass: 58.344, purity: "99-100%", purityValue: parsePurity("99-100%"), density: null },
  { srNo: 56, name: "Zinc Sulphate Heptahydrate", formula: "ZnSO4·7H2O", molarMass: 287.56, purity: "99-108%", purityValue: parsePurity("99-108%"), density: null },
  { srNo: 57, name: "Borax", formula: "Na2B4O7·10H2O", molarMass: 381.36, purity: "99-103%", purityValue: parsePurity("99-103%"), density: null },
  { srNo: 58, name: "Sodium Phosphate Dibasic Dihydrate", formula: "Na2HPO4·2H2O", molarMass: 177.99, purity: "98.00%", purityValue: parsePurity("98.00%"), density: null },
  { srNo: 59, name: "Sodium Lauryl Sulphate", formula: "C12H25NaO4S", molarMass: 288.38, purity: "", purityValue: null, density: null },
  { srNo: 60, name: "2-Ethoxy Ethanol", formula: "C4H10O2", molarMass: 90.12, purity: "99.00%", purityValue: parsePurity("99.00%"), density: 0.93 },
  { srNo: 61, name: "Methyl Red Water Soluble", formula: "C15H14N3NaO2", molarMass: 269.3, purity: "", purityValue: null, density: null },
  { srNo: 62, name: "Sodium Sulfate Anhydrous", formula: "Na2SO4", molarMass: 142.04, purity: "99.00%", purityValue: parsePurity("99.00%"), density: null },
  { srNo: 63, name: "Perchloric Acid", formula: "HClO4", molarMass: 100.46, purity: "69.5-72%", purityValue: parsePurity("69.5-72%"), density: null },
  { srNo: 64, name: "Ethanol", formula: "C2H5OH", molarMass: 46.07, purity: "99.80%", purityValue: parsePurity("99.80%"), density: 0.791 },
];

// Search inventory by name or formula (fuzzy match)
export function searchInventory(query: string): ChemicalCompound[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return chemicalInventory.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.formula.toLowerCase().includes(q)
  ).slice(0, 10);
}
