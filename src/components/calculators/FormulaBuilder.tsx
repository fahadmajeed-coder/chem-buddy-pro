import { useState, useRef, DragEvent } from 'react';
import { Plus, Trash2, Save, Check, X, Variable, Calculator, Search, GripVertical, FlaskConical, Play, FileText, ChevronDown, ChevronUp, Copy, Pencil } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SectionCloudSync } from './SectionCloudSync';

interface FormulaVariable {
  id: string;
  name: string;
  description: string;
  defaultValue: string;
  testValue: string;
}

interface SavedFormula {
  id: string;
  name: string;
  description: string;
  expression: string;
  variables: FormulaVariable[];
  createdAt: number;
}

interface Operation {
  token: string;       // what gets inserted into the expression (human-readable)
  name: string;        // searchable display name
  description: string; // tooltip / search hint
  category: string;
  icon?: string;       // visual symbol shown on button
}

// All operations use HUMAN-READABLE tokens. We convert to JS only at evaluation time.
const OPERATIONS: Operation[] = [
  // ─── Basic Arithmetic ───
  { token: '+', icon: '+', name: 'Add', description: 'Add two values together', category: 'Basic Arithmetic' },
  { token: '-', icon: '−', name: 'Subtract', description: 'Subtract one value from another', category: 'Basic Arithmetic' },
  { token: '*', icon: '×', name: 'Multiply', description: 'Multiply two values', category: 'Basic Arithmetic' },
  { token: '/', icon: '÷', name: 'Divide', description: 'Divide one value by another', category: 'Basic Arithmetic' },
  { token: '^', icon: 'xⁿ', name: 'Power', description: 'Raise to a power (e.g. x ^ 2 = x squared)', category: 'Basic Arithmetic' },
  { token: 'mod', icon: '%', name: 'Remainder', description: 'Remainder after division (modulo)', category: 'Basic Arithmetic' },

  // ─── Grouping ───
  { token: '(', icon: '(', name: 'Open Bracket', description: 'Start grouping — calculate this part first', category: 'Grouping' },
  { token: ')', icon: ')', name: 'Close Bracket', description: 'End grouping', category: 'Grouping' },
  { token: ',', icon: ',', name: 'Separator', description: 'Separate values inside a function (e.g. max(a, b))', category: 'Grouping' },

  // ─── Comparison ───
  { token: '>', icon: '>', name: 'Greater Than', description: 'Is left bigger than right? Returns 1 (yes) or 0 (no)', category: 'Comparison' },
  { token: '<', icon: '<', name: 'Less Than', description: 'Is left smaller than right? Returns 1 (yes) or 0 (no)', category: 'Comparison' },
  { token: '>=', icon: '≥', name: 'Greater or Equal', description: 'Is left bigger or equal? Returns 1 or 0', category: 'Comparison' },
  { token: '<=', icon: '≤', name: 'Less or Equal', description: 'Is left smaller or equal? Returns 1 or 0', category: 'Comparison' },
  { token: '==', icon: '=', name: 'Equals', description: 'Are both values the same? Returns 1 or 0', category: 'Comparison' },
  { token: '!=', icon: '≠', name: 'Not Equal', description: 'Are values different? Returns 1 or 0', category: 'Comparison' },

  // ─── Roots & Powers ───
  { token: 'sqrt(', icon: '√', name: 'Square Root', description: 'Square root of a number', category: 'Roots & Powers' },
  { token: 'cbrt(', icon: '∛', name: 'Cube Root', description: 'Cube root of a number', category: 'Roots & Powers' },
  { token: 'squared(', icon: 'x²', name: 'Squared', description: 'Multiply a number by itself', category: 'Roots & Powers' },
  { token: 'cubed(', icon: 'x³', name: 'Cubed', description: 'Number × itself × itself', category: 'Roots & Powers' },

  // ─── Rounding ───
  { token: 'round(', icon: '≈', name: 'Round', description: 'Round to the nearest whole number', category: 'Rounding' },
  { token: 'roundUp(', icon: '⌈x⌉', name: 'Round Up', description: 'Always round up to the next whole number', category: 'Rounding' },
  { token: 'roundDown(', icon: '⌊x⌋', name: 'Round Down', description: 'Always round down', category: 'Rounding' },
  { token: 'roundTo(', icon: '.0n', name: 'Round to Decimals', description: 'Round to N decimal places — roundTo(value, places)', category: 'Rounding' },
  { token: 'truncate(', icon: '✂', name: 'Truncate', description: 'Cut off decimal part without rounding', category: 'Rounding' },

  // ─── Logarithms & Exponentials ───
  { token: 'log(', icon: 'log', name: 'Logarithm (base 10)', description: 'Log base 10 — common in pH calculations', category: 'Logarithms & Exponentials' },
  { token: 'ln(', icon: 'ln', name: 'Natural Logarithm', description: 'Log base e — used in kinetics & thermodynamics', category: 'Logarithms & Exponentials' },
  { token: 'log2(', icon: 'log₂', name: 'Log base 2', description: 'Logarithm base 2', category: 'Logarithms & Exponentials' },
  { token: 'exp(', icon: 'eˣ', name: 'Exponential', description: 'e raised to a power — used in decay/growth', category: 'Logarithms & Exponentials' },
  { token: 'pow10(', icon: '10ˣ', name: 'Power of 10', description: '10 raised to a power — antilog', category: 'Logarithms & Exponentials' },

  // ─── Absolute & Sign ───
  { token: 'abs(', icon: '|x|', name: 'Absolute Value', description: 'Make any number positive', category: 'Absolute & Sign' },
  { token: 'sign(', icon: '±', name: 'Sign', description: 'Returns −1, 0, or +1 depending on the sign', category: 'Absolute & Sign' },
  { token: 'negate(', icon: '−x', name: 'Negate', description: 'Flip the sign (positive ↔ negative)', category: 'Absolute & Sign' },

  // ─── Min, Max & Clamp ───
  { token: 'min(', icon: 'min', name: 'Minimum', description: 'Smallest of two or more values — min(a, b)', category: 'Min, Max & Clamp' },
  { token: 'max(', icon: 'max', name: 'Maximum', description: 'Largest of two or more values — max(a, b)', category: 'Min, Max & Clamp' },
  { token: 'clamp(', icon: '⟨⟩', name: 'Clamp', description: 'Keep value between min and max — clamp(value, min, max)', category: 'Min, Max & Clamp' },

  // ─── Statistical — Central Tendency ───
  { token: 'average(', icon: 'x̄', name: 'Average (Mean)', description: 'Arithmetic mean — average(a, b, c)', category: 'Statistical — Central Tendency' },
  { token: 'median(', icon: 'M̃', name: 'Median', description: 'Middle value when sorted — median(a, b, c)', category: 'Statistical — Central Tendency' },
  { token: 'geometricMean(', icon: 'GM', name: 'Geometric Mean', description: 'Nth root of product — geometricMean(a, b, c)', category: 'Statistical — Central Tendency' },
  { token: 'harmonicMean(', icon: 'HM', name: 'Harmonic Mean', description: 'Reciprocal of average of reciprocals', category: 'Statistical — Central Tendency' },
  { token: 'weightedAvg(', icon: 'wx̄', name: 'Weighted Average', description: 'weightedAvg(val1, wt1, val2, wt2, ...)', category: 'Statistical — Central Tendency' },

  // ─── Statistical — Spread & Variability ───
  { token: 'sum(', icon: 'Σ', name: 'Sum', description: 'Add all values — sum(a, b, c)', category: 'Statistical — Spread & Variability' },
  { token: 'count(', icon: 'n', name: 'Count', description: 'Number of values — count(a, b, c)', category: 'Statistical — Spread & Variability' },
  { token: 'range(', icon: 'R', name: 'Range', description: 'Max minus Min', category: 'Statistical — Spread & Variability' },
  { token: 'variance(', icon: 'σ²', name: 'Variance (Population)', description: 'Average of squared deviations from mean', category: 'Statistical — Spread & Variability' },
  { token: 'sampleVariance(', icon: 's²', name: 'Variance (Sample)', description: 'Using n−1 divisor (Bessel correction)', category: 'Statistical — Spread & Variability' },
  { token: 'stdDev(', icon: 'σ', name: 'Std Deviation (Population)', description: 'Square root of population variance', category: 'Statistical — Spread & Variability' },
  { token: 'sampleStdDev(', icon: 's', name: 'Std Deviation (Sample)', description: 'Square root of sample variance (n−1)', category: 'Statistical — Spread & Variability' },
  { token: 'coeffVar(', icon: 'CV%', name: 'Coefficient of Variation', description: '(Std Dev / Mean) × 100 — relative variability', category: 'Statistical — Spread & Variability' },
  { token: 'meanAbsDev(', icon: 'MAD', name: 'Mean Absolute Deviation', description: 'Average of absolute deviations from mean', category: 'Statistical — Spread & Variability' },
  { token: 'sumOfSquares(', icon: 'SS', name: 'Sum of Squares', description: 'Sum of squared deviations from mean', category: 'Statistical — Spread & Variability' },

  // ─── Statistical — Error & Uncertainty ───
  { token: 'stdError(', icon: 'SE', name: 'Standard Error of Mean', description: 'Std Dev / √n — precision of mean estimate', category: 'Statistical — Error & Uncertainty' },
  { token: 'relStdDev(', icon: 'RSD', name: 'Relative Std Deviation (RSD)', description: 'Same as CV% — (s/x̄)×100', category: 'Statistical — Error & Uncertainty' },
  { token: 'confidenceInterval(', icon: 'CI', name: 'Confidence Interval (95%)', description: 'confidenceInterval(mean, stdDev, n) — returns ± margin', category: 'Statistical — Error & Uncertainty' },
  { token: 'zScore(', icon: 'z', name: 'Z-Score', description: 'zScore(value, mean, stdDev) — how many std devs from mean', category: 'Statistical — Error & Uncertainty' },
  { token: 'tValue(', icon: 't', name: 'T-Value (approx)', description: 'tValue(value, mean, stdDev, n)', category: 'Statistical — Error & Uncertainty' },
  { token: 'pooledStdDev(', icon: 'sp', name: 'Pooled Std Deviation', description: 'pooledStdDev(s1, n1, s2, n2)', category: 'Statistical — Error & Uncertainty' },
  { token: 'propagateAdd(', icon: '±+', name: 'Error Propagation (Add)', description: 'propagateAdd(err1, err2) = √(err1² + err2²)', category: 'Statistical — Error & Uncertainty' },
  { token: 'propagateMul(', icon: '±×', name: 'Error Propagation (Multiply)', description: 'propagateMul(val1, err1, val2, err2) — relative errors', category: 'Statistical — Error & Uncertainty' },

  // ─── Statistical — Regression & Correlation ───
  { token: 'slope(', icon: 'm', name: 'Slope (Linear Fit)', description: 'slope(x1,y1, x2,y2, ...) — best fit line slope', category: 'Statistical — Regression' },
  { token: 'intercept(', icon: 'b', name: 'Y-Intercept (Linear Fit)', description: 'intercept(x1,y1, x2,y2, ...) — where line crosses y-axis', category: 'Statistical — Regression' },
  { token: 'rSquared(', icon: 'R²', name: 'R-Squared', description: 'Coefficient of determination — goodness of fit', category: 'Statistical — Regression' },
  { token: 'correlation(', icon: 'r', name: 'Correlation Coefficient', description: 'Pearson correlation — correlation(x1,y1, x2,y2, ...)', category: 'Statistical — Regression' },

  // ─── Statistical — Outlier & Quality ───
  { token: 'grubbsG(', icon: 'G', name: "Grubbs' Test (G)", description: 'grubbsG(suspect, mean, stdDev) — outlier detection', category: 'Statistical — Outlier & Quality' },
  { token: 'dixonQ(', icon: 'Q', name: "Dixon's Q Test", description: 'dixonQ(suspect, nearest, range) — outlier ratio', category: 'Statistical — Outlier & Quality' },
  { token: 'percentile(', icon: 'Pk', name: 'Percentile', description: 'percentile(rank, a, b, c, ...) — value at given percentile', category: 'Statistical — Outlier & Quality' },
  { token: 'iqr(', icon: 'IQR', name: 'Interquartile Range', description: 'Q3 − Q1 — middle 50% spread', category: 'Statistical — Outlier & Quality' },
  { token: 'recoveryPercent(', icon: '%Rec', name: 'Recovery Percent', description: 'recoveryPercent(found, expected) = (found/expected)×100', category: 'Statistical — Outlier & Quality' },
  { token: 'horwitzRSD(', icon: 'PRSD', name: 'Horwitz Predicted RSD', description: 'horwitzRSD(concentration) — expected %RSD for a given conc', category: 'Statistical — Outlier & Quality' },
  { token: 'horratRatio(', icon: 'HorRat', name: 'HorRat Ratio', description: 'horratRatio(actualRSD, concentration) — method performance', category: 'Statistical — Outlier & Quality' },

  // ─── Percentage & Ratio ───
  { token: 'percent(', icon: '%', name: 'Percentage', description: 'Calculate percentage — percent(part, total) = (part/total)×100', category: 'Percentage & Ratio' },
  { token: 'percentOf(', icon: '%of', name: 'Percent Of', description: 'What is X% of Y — percentOf(percent, total)', category: 'Percentage & Ratio' },
  { token: 'ratio(', icon: 'a:b', name: 'Ratio', description: 'Ratio of two values — ratio(a, b) = a / b', category: 'Percentage & Ratio' },
  { token: 'ppm(', icon: 'ppm', name: 'Parts Per Million', description: 'Convert to ppm — ppm(part, total) = (part/total)×1000000', category: 'Percentage & Ratio' },
  { token: 'ppb(', icon: 'ppb', name: 'Parts Per Billion', description: 'Convert to ppb — ppb(part, total) = (part/total)×1e9', category: 'Percentage & Ratio' },

  // ─── Trigonometry ───
  { token: 'sin(', icon: 'sin', name: 'Sine', description: 'Sine (input in radians)', category: 'Trigonometry' },
  { token: 'cos(', icon: 'cos', name: 'Cosine', description: 'Cosine (input in radians)', category: 'Trigonometry' },
  { token: 'tan(', icon: 'tan', name: 'Tangent', description: 'Tangent (input in radians)', category: 'Trigonometry' },
  { token: 'asin(', icon: 'sin⁻¹', name: 'Arc Sine (Inverse)', description: 'Inverse sine — returns radians', category: 'Trigonometry' },
  { token: 'acos(', icon: 'cos⁻¹', name: 'Arc Cosine (Inverse)', description: 'Inverse cosine — returns radians', category: 'Trigonometry' },
  { token: 'atan(', icon: 'tan⁻¹', name: 'Arc Tangent (Inverse)', description: 'Inverse tangent — returns radians', category: 'Trigonometry' },
  { token: 'toRadians(', icon: 'rad', name: 'Degrees → Radians', description: 'Convert degrees to radians', category: 'Trigonometry' },
  { token: 'toDegrees(', icon: 'deg', name: 'Radians → Degrees', description: 'Convert radians to degrees', category: 'Trigonometry' },
  { token: 'hypot(', icon: 'hyp', name: 'Hypotenuse', description: 'Length of hypotenuse — hypot(a, b) = √(a² + b²)', category: 'Trigonometry' },

  // ─── Chemistry Helpers ───
  { token: 'molarity(', icon: 'M', name: 'Molarity', description: 'molarity(mass_g, molWeight, volume_L)', category: 'Chemistry Helpers' },
  { token: 'dilution(', icon: 'C₁V₁', name: 'Dilution', description: 'dilution(C1, V1, V2) = C1×V1/V2', category: 'Chemistry Helpers' },
  { token: 'percentYield(', icon: '%Y', name: 'Percent Yield', description: 'percentYield(actual, theoretical) = (actual/theoretical)×100', category: 'Chemistry Helpers' },
  { token: 'percentError(', icon: '%E', name: 'Percent Error', description: 'percentError(experimental, theoretical)', category: 'Chemistry Helpers' },
  { token: 'percentPurity(', icon: '%P', name: 'Percent Purity', description: 'percentPurity(pure_mass, total_mass) = (pure/total)×100', category: 'Chemistry Helpers' },
  { token: 'normality(', icon: 'N', name: 'Normality', description: 'normality(mass_g, eqWeight, volume_L)', category: 'Chemistry Helpers' },

  // ─── Unit Conversions ───
  { token: 'gToMg(', icon: 'g→mg', name: 'Grams to Milligrams', description: 'Multiply by 1000', category: 'Unit Conversions' },
  { token: 'mgToG(', icon: 'mg→g', name: 'Milligrams to Grams', description: 'Divide by 1000', category: 'Unit Conversions' },
  { token: 'LToMl(', icon: 'L→mL', name: 'Liters to Milliliters', description: 'Multiply by 1000', category: 'Unit Conversions' },
  { token: 'mlToL(', icon: 'mL→L', name: 'Milliliters to Liters', description: 'Divide by 1000', category: 'Unit Conversions' },
  { token: 'celToFah(', icon: '°C→°F', name: 'Celsius to Fahrenheit', description: '(C × 9/5) + 32', category: 'Unit Conversions' },
  { token: 'fahToCel(', icon: '°F→°C', name: 'Fahrenheit to Celsius', description: '(F − 32) × 5/9', category: 'Unit Conversions' },
  { token: 'celToKel(', icon: '°C→K', name: 'Celsius to Kelvin', description: 'C + 273.15', category: 'Unit Conversions' },
  { token: 'kelToCel(', icon: 'K→°C', name: 'Kelvin to Celsius', description: 'K − 273.15', category: 'Unit Conversions' },

  // ─── Constants ───
  { token: 'π', icon: 'π', name: 'Pi', description: '3.14159... — ratio of circumference to diameter', category: 'Constants' },
  { token: 'E_CONST', icon: 'e', name: "Euler's Number", description: '2.71828... — base of natural logarithm', category: 'Constants' },
  { token: 'AVOGADRO', icon: 'Nₐ', name: "Avogadro's Number", description: '6.022 × 10²³ — atoms/molecules per mole', category: 'Constants' },
  { token: 'GAS_R', icon: 'R', name: 'Gas Constant (R)', description: '8.314 J/(mol·K)', category: 'Constants' },
  { token: 'FARADAY', icon: 'F', name: 'Faraday Constant', description: '96485 C/mol — charge per mole of electrons', category: 'Constants' },
  { token: 'BOLTZMANN', icon: 'kB', name: 'Boltzmann Constant', description: '1.381 × 10⁻²³ J/K', category: 'Constants' },
  { token: 'PLANCK', icon: 'h', name: 'Planck Constant', description: '6.626 × 10⁻³⁴ J·s', category: 'Constants' },
  { token: 'SPEED_OF_LIGHT', icon: 'c', name: 'Speed of Light', description: '2.998 × 10⁸ m/s', category: 'Constants' },
  { token: 'ATM_TO_PA', icon: 'atm', name: '1 atm in Pascals', description: '101325 Pa', category: 'Constants' },
  { token: 'WATER_MW', icon: 'H₂O', name: 'Water Molar Mass', description: '18.015 g/mol', category: 'Constants' },
];

// Category display order
const CATEGORY_ORDER = [
  'Basic Arithmetic', 'Grouping', 'Roots & Powers', 'Rounding',
  'Logarithms & Exponentials', 'Absolute & Sign', 'Min, Max & Clamp',
  'Statistical — Central Tendency', 'Statistical — Spread & Variability',
  'Statistical — Error & Uncertainty', 'Statistical — Regression',
  'Statistical — Outlier & Quality',
  'Percentage & Ratio', 'Comparison',
  'Trigonometry', 'Chemistry Helpers', 'Unit Conversions', 'Constants',
];

/**
 * Convert human-readable expression → JavaScript for evaluation.
 * Users never see Math.* or JS syntax — they write sqrt(, log(, ^, etc.
 */
function toJavaScript(expr: string): string {
  let js = expr;

  // Multi-arg helper functions → inline JS
  // Statistical
  js = js.replace(/\baverage\(([^)]+)\)/g, '(($1) => { const _a = [$1]; return _a.reduce((s,v)=>s+v,0)/_a.length; })($1)');
  // Actually, let's use a simpler approach: define helpers in the eval scope

  // Single-arg math functions
  js = js.replace(/\bsqrt\(/g, 'Math.sqrt(');
  js = js.replace(/\bcbrt\(/g, 'Math.cbrt(');
  js = js.replace(/\bsquared\(([^)]+)\)/g, '(($1) ** 2)');
  js = js.replace(/\bcubed\(([^)]+)\)/g, '(($1) ** 3)');
  js = js.replace(/\babs\(/g, 'Math.abs(');
  js = js.replace(/\bsign\(/g, 'Math.sign(');
  js = js.replace(/\bnegate\(([^)]+)\)/g, '(-($1))');
  js = js.replace(/\broundUp\(/g, 'Math.ceil(');
  js = js.replace(/\broundDown\(/g, 'Math.floor(');
  js = js.replace(/\broundTo\(([^,]+),\s*([^)]+)\)/g, '(Math.round(($1) * Math.pow(10, $2)) / Math.pow(10, $2))');
  js = js.replace(/\bround\(/g, 'Math.round(');
  js = js.replace(/\btruncate\(/g, 'Math.trunc(');
  js = js.replace(/\blog2\(/g, 'Math.log2(');
  js = js.replace(/\blog\(/g, 'Math.log10(');
  js = js.replace(/\bln\(/g, 'Math.log(');
  js = js.replace(/\bexp\(/g, 'Math.exp(');
  js = js.replace(/\bpow10\(([^)]+)\)/g, 'Math.pow(10, $1)');

  // Trig
  js = js.replace(/\basin\(/g, 'Math.asin(');
  js = js.replace(/\bacos\(/g, 'Math.acos(');
  js = js.replace(/\batan\(/g, 'Math.atan(');
  js = js.replace(/\bsin\(/g, 'Math.sin(');
  js = js.replace(/\bcos\(/g, 'Math.cos(');
  js = js.replace(/\btan\(/g, 'Math.tan(');
  js = js.replace(/\btoRadians\(([^)]+)\)/g, '(($1) * Math.PI / 180)');
  js = js.replace(/\btoDegrees\(([^)]+)\)/g, '(($1) * 180 / Math.PI)');
  js = js.replace(/\bhypot\(/g, 'Math.hypot(');

  // Min/Max/Clamp
  js = js.replace(/\bmin\(/g, 'Math.min(');
  js = js.replace(/\bmax\(/g, 'Math.max(');
  js = js.replace(/\bclamp\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, 'Math.min(Math.max(($1), ($2)), ($3))');

  // Statistical — Central Tendency
  js = js.replace(/\baverage\(([^)]+)\)/g, '(function(){var _v=[$1];return _v.reduce(function(a,b){return a+b},0)/_v.length}())');
  js = js.replace(/\bmedian\(([^)]+)\)/g, '(function(){var _v=[$1].sort(function(a,b){return a-b});var _m=Math.floor(_v.length/2);return _v.length%2?_v[_m]:(_v[_m-1]+_v[_m])/2}())');
  js = js.replace(/\bgeometricMean\(([^)]+)\)/g, '(function(){var _v=[$1];return Math.pow(_v.reduce(function(a,b){return a*b},1),1/_v.length)}())');
  js = js.replace(/\bharmonicMean\(([^)]+)\)/g, '(function(){var _v=[$1];return _v.length/_v.reduce(function(a,b){return a+1/b},0)}())');
  js = js.replace(/\bweightedAvg\(([^)]+)\)/g, '(function(){var _a=[$1];var _s=0,_w=0;for(var i=0;i<_a.length;i+=2){_s+=_a[i]*_a[i+1];_w+=_a[i+1]}return _s/_w}())');

  // Statistical — Spread & Variability
  js = js.replace(/\bsum\(([^)]+)\)/g, '([$1].reduce(function(a,b){return a+b},0))');
  js = js.replace(/\bcount\(([^)]+)\)/g, '([$1].length)');
  js = js.replace(/\brange\(([^)]+)\)/g, '(Math.max($1) - Math.min($1))');
  js = js.replace(/\bsampleVariance\(([^)]+)\)/g, '(function(){var _v=[$1];var _m=_v.reduce(function(a,b){return a+b},0)/_v.length;return _v.reduce(function(a,b){return a+Math.pow(b-_m,2)},0)/(_v.length-1)}())');
  js = js.replace(/\bvariance\(([^)]+)\)/g, '(function(){var _v=[$1];var _m=_v.reduce(function(a,b){return a+b},0)/_v.length;return _v.reduce(function(a,b){return a+Math.pow(b-_m,2)},0)/_v.length}())');
  js = js.replace(/\bsampleStdDev\(([^)]+)\)/g, '(function(){var _v=[$1];var _m=_v.reduce(function(a,b){return a+b},0)/_v.length;return Math.sqrt(_v.reduce(function(a,b){return a+Math.pow(b-_m,2)},0)/(_v.length-1))}())');
  js = js.replace(/\bstdDev\(([^)]+)\)/g, '(function(){var _v=[$1];var _m=_v.reduce(function(a,b){return a+b},0)/_v.length;return Math.sqrt(_v.reduce(function(a,b){return a+Math.pow(b-_m,2)},0)/_v.length)}())');
  js = js.replace(/\bcoeffVar\(([^)]+)\)/g, '(function(){var _v=[$1];var _m=_v.reduce(function(a,b){return a+b},0)/_v.length;var _s=Math.sqrt(_v.reduce(function(a,b){return a+Math.pow(b-_m,2)},0)/(_v.length-1));return(_s/_m)*100}())');
  js = js.replace(/\bmeanAbsDev\(([^)]+)\)/g, '(function(){var _v=[$1];var _m=_v.reduce(function(a,b){return a+b},0)/_v.length;return _v.reduce(function(a,b){return a+Math.abs(b-_m)},0)/_v.length}())');
  js = js.replace(/\bsumOfSquares\(([^)]+)\)/g, '(function(){var _v=[$1];var _m=_v.reduce(function(a,b){return a+b},0)/_v.length;return _v.reduce(function(a,b){return a+Math.pow(b-_m,2)},0)}())');

  // Statistical — Error & Uncertainty
  js = js.replace(/\bstdError\(([^)]+)\)/g, '(function(){var _v=[$1];var _m=_v.reduce(function(a,b){return a+b},0)/_v.length;var _s=Math.sqrt(_v.reduce(function(a,b){return a+Math.pow(b-_m,2)},0)/(_v.length-1));return _s/Math.sqrt(_v.length)}())');
  js = js.replace(/\brelStdDev\(([^)]+)\)/g, '(function(){var _v=[$1];var _m=_v.reduce(function(a,b){return a+b},0)/_v.length;var _s=Math.sqrt(_v.reduce(function(a,b){return a+Math.pow(b-_m,2)},0)/(_v.length-1));return(_s/_m)*100}())');
  js = js.replace(/\bconfidenceInterval\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '(1.96 * ($2) / Math.sqrt($3))');
  js = js.replace(/\bzScore\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '((($1) - ($2)) / ($3))');
  js = js.replace(/\btValue\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '((($1) - ($2)) / (($3) / Math.sqrt($4)))');
  js = js.replace(/\bpooledStdDev\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '(Math.sqrt(((($2)-1)*Math.pow($1,2) + (($4)-1)*Math.pow($3,2)) / (($2)+($4)-2)))');
  js = js.replace(/\bpropagateAdd\(([^,]+),\s*([^)]+)\)/g, '(Math.sqrt(Math.pow($1,2) + Math.pow($2,2)))');
  js = js.replace(/\bpropagateMul\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '(Math.abs(($1)*($3)) * Math.sqrt(Math.pow(($2)/($1),2) + Math.pow(($4)/($3),2)))');

  // Statistical — Regression (paired data: x1,y1, x2,y2, ...)
  js = js.replace(/\bslope\(([^)]+)\)/g, '(function(){var _a=[$1];var _x=[],_y=[];for(var i=0;i<_a.length;i+=2){_x.push(_a[i]);_y.push(_a[i+1])}var n=_x.length;var sx=_x.reduce(function(a,b){return a+b},0);var sy=_y.reduce(function(a,b){return a+b},0);var sxy=_x.reduce(function(a,b,i){return a+b*_y[i]},0);var sx2=_x.reduce(function(a,b){return a+b*b},0);return(n*sxy-sx*sy)/(n*sx2-sx*sx)}())');
  js = js.replace(/\bintercept\(([^)]+)\)/g, '(function(){var _a=[$1];var _x=[],_y=[];for(var i=0;i<_a.length;i+=2){_x.push(_a[i]);_y.push(_a[i+1])}var n=_x.length;var sx=_x.reduce(function(a,b){return a+b},0);var sy=_y.reduce(function(a,b){return a+b},0);var sxy=_x.reduce(function(a,b,i){return a+b*_y[i]},0);var sx2=_x.reduce(function(a,b){return a+b*b},0);var m=(n*sxy-sx*sy)/(n*sx2-sx*sx);return(sy-m*sx)/n}())');
  js = js.replace(/\bcorrelation\(([^)]+)\)/g, '(function(){var _a=[$1];var _x=[],_y=[];for(var i=0;i<_a.length;i+=2){_x.push(_a[i]);_y.push(_a[i+1])}var n=_x.length;var sx=_x.reduce(function(a,b){return a+b},0);var sy=_y.reduce(function(a,b){return a+b},0);var sxy=_x.reduce(function(a,b,i){return a+b*_y[i]},0);var sx2=_x.reduce(function(a,b){return a+b*b},0);var sy2=_y.reduce(function(a,b){return a+b*b},0);return(n*sxy-sx*sy)/Math.sqrt((n*sx2-sx*sx)*(n*sy2-sy*sy))}())');
  js = js.replace(/\brSquared\(([^)]+)\)/g, '(function(){var _a=[$1];var _x=[],_y=[];for(var i=0;i<_a.length;i+=2){_x.push(_a[i]);_y.push(_a[i+1])}var n=_x.length;var sx=_x.reduce(function(a,b){return a+b},0);var sy=_y.reduce(function(a,b){return a+b},0);var sxy=_x.reduce(function(a,b,i){return a+b*_y[i]},0);var sx2=_x.reduce(function(a,b){return a+b*b},0);var sy2=_y.reduce(function(a,b){return a+b*b},0);var r=(n*sxy-sx*sy)/Math.sqrt((n*sx2-sx*sx)*(n*sy2-sy*sy));return r*r}())');

  // Statistical — Outlier & Quality
  js = js.replace(/\bgrubbsG\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '(Math.abs(($1) - ($2)) / ($3))');
  js = js.replace(/\bdixonQ\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '(Math.abs(($1) - ($2)) / ($3))');
  js = js.replace(/\bpercentile\(([^)]+)\)/g, '(function(){var _a=[$1];var _r=_a.shift();var _s=_a.sort(function(a,b){return a-b});var _i=(_r/100)*(_s.length-1);var _l=Math.floor(_i);return _l===_i?_s[_l]:_s[_l]+(_i-_l)*(_s[_l+1]-_s[_l])}())');
  js = js.replace(/\biqr\(([^)]+)\)/g, '(function(){var _s=[$1].sort(function(a,b){return a-b});var _q=function(a,p){var i=(p/100)*(a.length-1);var l=Math.floor(i);return l===i?a[l]:a[l]+(i-l)*(a[l+1]-a[l])};return _q(_s,75)-_q(_s,25)}())');
  js = js.replace(/\brecoveryPercent\(([^,]+),\s*([^)]+)\)/g, '((($1) / ($2)) * 100)');
  js = js.replace(/\bhorwitzRSD\(([^)]+)\)/g, '(Math.pow(2, 1 - 0.5 * Math.log10($1)))');
  js = js.replace(/\bhorratRatio\(([^,]+),\s*([^)]+)\)/g, '(($1) / Math.pow(2, 1 - 0.5 * Math.log10($2)))');


  // Percentage & Ratio
  js = js.replace(/\bpercent\(([^,]+),\s*([^)]+)\)/g, '((($1) / ($2)) * 100)');
  js = js.replace(/\bpercentOf\(([^,]+),\s*([^)]+)\)/g, '((($1) / 100) * ($2))');
  js = js.replace(/\bratio\(([^,]+),\s*([^)]+)\)/g, '(($1) / ($2))');
  js = js.replace(/\bppm\(([^,]+),\s*([^)]+)\)/g, '((($1) / ($2)) * 1000000)');
  js = js.replace(/\bppb\(([^,]+),\s*([^)]+)\)/g, '((($1) / ($2)) * 1000000000)');

  // Chemistry helpers
  js = js.replace(/\bmolarity\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '((($1) / ($2)) / ($3))');
  js = js.replace(/\bdilution\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '((($1) * ($2)) / ($3))');
  js = js.replace(/\bpercentYield\(([^,]+),\s*([^)]+)\)/g, '((($1) / ($2)) * 100)');
  js = js.replace(/\bpercentError\(([^,]+),\s*([^)]+)\)/g, '((Math.abs(($1) - ($2)) / Math.abs($2)) * 100)');
  js = js.replace(/\bpercentPurity\(([^,]+),\s*([^)]+)\)/g, '((($1) / ($2)) * 100)');
  js = js.replace(/\bnormality\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '((($1) / ($2)) / ($3))');

  // Unit conversions
  js = js.replace(/\bgToMg\(([^)]+)\)/g, '(($1) * 1000)');
  js = js.replace(/\bmgToG\(([^)]+)\)/g, '(($1) / 1000)');
  js = js.replace(/\bLToMl\(([^)]+)\)/g, '(($1) * 1000)');
  js = js.replace(/\bmlToL\(([^)]+)\)/g, '(($1) / 1000)');
  js = js.replace(/\bcelToFah\(([^)]+)\)/g, '((($1) * 9 / 5) + 32)');
  js = js.replace(/\bfahToCel\(([^)]+)\)/g, '((($1) - 32) * 5 / 9)');
  js = js.replace(/\bcelToKel\(([^)]+)\)/g, '(($1) + 273.15)');
  js = js.replace(/\bkelToCel\(([^)]+)\)/g, '(($1) - 273.15)');

  // Constants
  js = js.replace(/π/g, 'Math.PI');
  js = js.replace(/\bE_CONST\b/g, 'Math.E');
  js = js.replace(/\bAVOGADRO\b/g, '6.02214076e23');
  js = js.replace(/\bGAS_R\b/g, '8.314462618');
  js = js.replace(/\bFARADAY\b/g, '96485.33212');
  js = js.replace(/\bBOLTZMANN\b/g, '1.380649e-23');
  js = js.replace(/\bPLANCK\b/g, '6.62607015e-34');
  js = js.replace(/\bSPEED_OF_LIGHT\b/g, '299792458');
  js = js.replace(/\bATM_TO_PA\b/g, '101325');
  js = js.replace(/\bWATER_MW\b/g, '18.015');

  // Operators
  js = js.replace(/\^/g, '**');
  js = js.replace(/\bmod\b/g, '%');

  return js;
}

export function FormulaBuilder({ isAdmin = true }: { isAdmin?: boolean } = {}) {
  const [variables, setVariables] = useState<FormulaVariable[]>([
    { id: 'v1', name: 'x', description: '', defaultValue: '', testValue: '' },
    { id: 'v2', name: 'y', description: '', defaultValue: '', testValue: '' },
  ]);
  const [expression, setExpression] = useState('');
  const [formulaName, setFormulaName] = useState('');
  const [formulaDesc, setFormulaDesc] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);
  const [opSearch, setOpSearch] = useState('');
  const [showOpPanel, setShowOpPanel] = useState(true);
  const [savedFormulas, setSavedFormulas] = useLocalStorage<SavedFormula[]>('chem-formulas-v2', []);
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null);
  const [newVarName, setNewVarName] = useState('');
  const [newVarDesc, setNewVarDesc] = useState('');
  const [newVarDefault, setNewVarDefault] = useState('');
  const expressionRef = useRef<HTMLTextAreaElement>(null);
  const [draggedVar, setDraggedVar] = useState<string | null>(null);
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  const [editingVarId, setEditingVarId] = useState<string | null>(null);

  // --- Variable Management ---
  const getNextAutoName = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const usedNames = new Set(variables.map(v => v.name));
    for (const ch of alphabet) {
      if (!usedNames.has(ch)) return ch;
    }
    let i = 1;
    while (usedNames.has(`var${i}`)) i++;
    return `var${i}`;
  };

  const addVariable = () => {
    let name = newVarName.trim();
    if (!name) name = getNextAutoName();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return;
    if (variables.some(v => v.name === name)) return;
    const reserved = ['sqrt', 'cbrt', 'squared', 'cubed', 'abs', 'sign', 'negate', 'round', 'roundUp', 'roundDown', 'roundTo', 'truncate', 'log', 'log2', 'ln', 'exp', 'pow10', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'toRadians', 'toDegrees', 'hypot', 'min', 'max', 'clamp', 'average', 'median', 'geometricMean', 'harmonicMean', 'weightedAvg', 'sum', 'count', 'range', 'variance', 'sampleVariance', 'stdDev', 'sampleStdDev', 'coeffVar', 'meanAbsDev', 'sumOfSquares', 'stdError', 'relStdDev', 'confidenceInterval', 'zScore', 'tValue', 'pooledStdDev', 'propagateAdd', 'propagateMul', 'slope', 'intercept', 'rSquared', 'correlation', 'grubbsG', 'dixonQ', 'percentile', 'iqr', 'recoveryPercent', 'horwitzRSD', 'horratRatio', 'percent', 'percentOf', 'ratio', 'ppm', 'ppb', 'molarity', 'dilution', 'percentYield', 'percentError', 'percentPurity', 'normality', 'gToMg', 'mgToG', 'LToMl', 'mlToL', 'celToFah', 'fahToCel', 'celToKel', 'kelToCel', 'mod', 'E_CONST', 'AVOGADRO', 'GAS_R', 'FARADAY', 'BOLTZMANN', 'PLANCK', 'SPEED_OF_LIGHT', 'ATM_TO_PA', 'WATER_MW'];
    if (reserved.includes(name)) return;
    setVariables(prev => [...prev, { id: `v-${Date.now()}`, name, description: newVarDesc.trim(), defaultValue: newVarDefault.trim(), testValue: newVarDefault.trim() }]);
    setNewVarName('');
    setNewVarDesc('');
    setNewVarDefault('');
  };

  const removeVariable = (id: string) => {
    if (variables.length <= 1) return;
    setVariables(prev => prev.filter(v => v.id !== id));
  };

  const updateVariable = (id: string, field: keyof FormulaVariable, val: string) => {
    setVariables(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v));
  };

  // --- Drag & Drop ---
  const handleDragStart = (ev: DragEvent, varName: string) => {
    ev.dataTransfer.setData('text/plain', varName);
    setDraggedVar(varName);
  };
  const handleDragEnd = () => setDraggedVar(null);
  const handleDrop = (ev: DragEvent) => {
    ev.preventDefault();
    const varName = ev.dataTransfer.getData('text/plain');
    if (varName) insertToken(varName);
    setDraggedVar(null);
  };
  const handleDragOver = (ev: DragEvent) => ev.preventDefault();

  // --- Expression ---
  const insertToken = (token: string) => {
    const ta = expressionRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = expression.slice(0, start);
      const after = expression.slice(end);
      const pad = before && !before.endsWith(' ') && !before.endsWith('(') ? ' ' : '';
      const newExpr = before + pad + token + ' ' + after;
      setExpression(newExpr);
      setTestPassed(null); setTestResult(null); setTestError(null);
      setTimeout(() => {
        const pos = (before + pad + token + ' ').length;
        ta.focus();
        ta.setSelectionRange(pos, pos);
      }, 0);
    } else {
      setExpression(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('(') ? ' ' : '') + token + ' ');
      setTestPassed(null); setTestResult(null); setTestError(null);
    }
  };

  // --- Test Formula ---
  const testFormula = () => {
    setTestError(null);
    setTestResult(null);
    setTestPassed(null);

    const rawExpr = expression.trim();
    if (!rawExpr) { setTestError('Write a formula expression first'); return; }

    // Check all variables have test values
    for (const v of variables) {
      if (rawExpr.includes(v.name) && v.testValue.trim() === '') {
        setTestError(`Give "${v.name}" a test value to run the formula`);
        return;
      }
    }

    // Replace variables with test values (longest first)
    let expr = rawExpr;
    const sorted = [...variables].sort((a, b) => b.name.length - a.name.length);
    for (const v of sorted) {
      const val = parseFloat(v.testValue);
      if (expr.includes(v.name) && isNaN(val)) {
        setTestError(`"${v.name}" must be a number`);
        return;
      }
      expr = expr.replace(new RegExp(`\\b${v.name}\\b`, 'g'), `(${val})`);
    }

    // Convert human-readable → JS
    const jsExpr = toJavaScript(expr);

    // Validation is handled by the try/catch — toJavaScript converts everything

    try {
      const fn = new Function(`"use strict"; return (${jsExpr});`);
      const res = fn();

      if (typeof res !== 'number' || !isFinite(res)) {
        setTestError('Result is not a valid number (got Infinity or undefined)');
        setTestPassed(false);
        return;
      }

      const formatted = res % 1 === 0 ? res.toString() : res.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
      setTestResult(formatted);
      setTestPassed(true);
    } catch (err: any) {
      setTestError(`Could not calculate: ${err.message}`);
      setTestPassed(false);
    }
  };

  // --- Save ---
  const saveFormula = () => {
    if (!formulaName.trim() || !expression.trim()) return;
    if (testPassed !== true) {
      setTestError('Test the formula first — it must pass before saving');
      return;
    }
    const formula: SavedFormula = {
      id: editingFormulaId || `f-${Date.now()}`,
      name: formulaName.trim(),
      description: formulaDesc.trim(),
      expression,
      variables: variables.map(v => ({ ...v, testValue: '' })),
      createdAt: editingFormulaId
        ? (savedFormulas.find(f => f.id === editingFormulaId)?.createdAt || Date.now())
        : Date.now(),
    };
    if (editingFormulaId) {
      setSavedFormulas(prev => prev.map(f => f.id === editingFormulaId ? formula : f));
    } else {
      setSavedFormulas(prev => [formula, ...prev]);
    }
    resetBuilder();
  };

  const resetBuilder = () => {
    setFormulaName('');
    setFormulaDesc('');
    setExpression('');
    setVariables([{ id: 'v1', name: 'x', description: '', defaultValue: '', testValue: '' }, { id: 'v2', name: 'y', description: '', defaultValue: '', testValue: '' }]);
    setTestResult(null);
    setTestError(null);
    setTestPassed(null);
    setEditingFormulaId(null);
  };

  const deleteFormula = (id: string) => {
    setSavedFormulas(prev => prev.filter(f => f.id !== id));
    if (editingFormulaId === id) resetBuilder();
  };

  const loadFormula = (f: SavedFormula) => {
    setExpression(f.expression);
    setVariables(f.variables.map(v => ({ ...v, testValue: v.defaultValue || '' })));
    setFormulaName(f.name);
    setFormulaDesc(f.description);
    setTestResult(null);
    setTestError(null);
    setTestPassed(null);
    setEditingFormulaId(f.id);
  };

  const duplicateFormula = (f: SavedFormula) => {
    const dup: SavedFormula = {
      ...f,
      id: `f-${Date.now()}`,
      name: `${f.name} (Copy)`,
      createdAt: Date.now(),
      variables: f.variables.map(v => ({ ...v, id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    setSavedFormulas(prev => [dup, ...prev]);
  };

  // --- Filtered operations ---
  const filteredOps = opSearch
    ? OPERATIONS.filter(op =>
        op.name.toLowerCase().includes(opSearch.toLowerCase()) ||
        op.token.toLowerCase().includes(opSearch.toLowerCase()) ||
        op.description.toLowerCase().includes(opSearch.toLowerCase())
      )
    : OPERATIONS;

  const groupedOps: Record<string, Operation[]> = {};
  for (const cat of CATEGORY_ORDER) {
    const ops = filteredOps.filter(op => op.category === cat);
    if (ops.length > 0) groupedOps[cat] = ops;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {!isAdmin && (
        <div className="glass-panel rounded-lg p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="text-primary">🔒</span> You are in view-only mode. Login as Admin to create, edit, or delete formulas.
          </p>
        </div>
      )}

      {isAdmin && (
        <>
      {/* Step 1: Define Variables */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Variable className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 1 — Define Your Variables</h3>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Drag into formula below</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Existing variables as draggable chips */}
          <div className="flex flex-wrap gap-2">
            {variables.map(v => (
              <div
                key={v.id}
                draggable={editingVarId !== v.id}
                onDragStart={ev => handleDragStart(ev, v.name)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${
                  editingVarId === v.id
                    ? 'border-primary bg-primary/10'
                    : draggedVar === v.name
                    ? 'border-primary bg-primary/20 scale-95 cursor-grab active:cursor-grabbing'
                    : 'border-border bg-secondary/50 hover:border-primary/40 cursor-grab active:cursor-grabbing'
                }`}
              >
                {editingVarId === v.id ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      value={v.description}
                      onChange={ev => updateVariable(v.id, 'description', ev.target.value)}
                      placeholder="Description"
                      className="w-28 bg-input border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="number"
                      value={v.defaultValue}
                      onChange={ev => updateVariable(v.id, 'defaultValue', ev.target.value)}
                      placeholder="Default"
                      className="w-20 bg-input border border-border rounded px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="font-mono text-xs font-medium text-primary">{v.name}</span>
                    <button onClick={() => setEditingVarId(null)} className="p-0.5 text-primary hover:text-primary/80">
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                    <span className="font-mono text-sm font-medium text-primary">{v.name}</span>
                    {v.description && (
                      <span className="text-[10px] text-muted-foreground max-w-[120px] truncate">({v.description})</span>
                    )}
                    {v.defaultValue && (
                      <span className="text-[10px] font-mono text-accent-foreground bg-accent/30 px-1.5 py-0.5 rounded">={v.defaultValue}</span>
                    )}
                    <button onClick={() => setEditingVarId(v.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all p-0.5">
                      <Pencil className="w-3 h-3" />
                    </button>
                    {variables.length > 1 && (
                      <button onClick={() => removeVariable(v.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new variable */}
          <div className="flex items-end gap-2 pt-2 border-t border-border/50">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Name</label>
              <input
                value={newVarName}
                onChange={ev => setNewVarName(ev.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="e.g. mass, volume, density"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={ev => ev.key === 'Enter' && addVariable()}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">What is it? (optional)</label>
              <input
                value={newVarDesc}
                onChange={ev => setNewVarDesc(ev.target.value)}
                placeholder="e.g. mass in grams"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={ev => ev.key === 'Enter' && addVariable()}
              />
            </div>
            <div className="w-28 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Default (optional)</label>
              <input
                type="text"
                inputMode="decimal"
                value={newVarDefault}
                onChange={ev => {
                  const val = ev.target.value;
                  if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                    setNewVarDefault(val);
                  }
                }}
                placeholder="0"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onKeyDown={ev => ev.key === 'Enter' && addVariable()}
              />
            </div>
            <button
              onClick={addVariable}
              disabled={!newVarName.trim() || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newVarName.trim()) || variables.some(v => v.name === newVarName.trim())}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Give each input a name (letters, numbers, underscores). Example: <span className="font-mono text-primary">mass</span>, <span className="font-mono text-primary">volume_ml</span>, <span className="font-mono text-primary">purity</span>
          </p>
        </div>
      </div>

      {/* Step 2: Build Expression */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 2 — Build Your Formula</h3>
          </div>
          <button
            onClick={() => setShowOpPanel(!showOpPanel)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-3 h-3" />
            {showOpPanel ? 'Hide' : 'Show'} Math Operations
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Operations panel */}
          {showOpPanel && (
            <div className="relative">
              <div className="absolute left-0 right-0 top-0 z-50 border border-border rounded-md bg-card shadow-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-border bg-card">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={opSearch}
                      onChange={ev => setOpSearch(ev.target.value)}
                      placeholder="Search... (e.g. square root, divide, round up)"
                      className="w-full bg-input border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto p-2 space-y-3 bg-card">
                  {Object.entries(groupedOps).map(([category, ops]) => (
                    <div key={category}>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-1.5">{category}</p>
                      <div className="flex flex-wrap gap-1">
                        {ops.map(op => (
                          <button
                            key={op.token}
                            onClick={() => insertToken(op.token)}
                            title={op.description}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/30 transition-colors group"
                          >
                            <span className="font-mono text-primary text-sm">{op.icon || op.token}</span>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{op.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredOps.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-3">No matching operations found</p>
                  )}
                </div>
              </div>
              {/* Spacer to prevent content jump when panel is open */}
              <div className="h-[340px]" />
            </div>
          )}

          {/* Quick variable buttons */}
          <div className="flex flex-wrap gap-1.5">
            {variables.map(v => (
              <button
                key={v.id}
                onClick={() => insertToken(v.name)}
                className="px-3 py-1.5 rounded-md text-sm font-mono bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                title={v.description || v.name}
              >
                {v.name}
              </button>
            ))}
            <span className="text-[10px] text-muted-foreground self-center ml-2">← click or drag into formula</span>
          </div>

          {/* Expression textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Formula</label>
            <textarea
              ref={expressionRef}
              value={expression}
              onChange={ev => { setExpression(ev.target.value); setTestPassed(null); setTestResult(null); setTestError(null); }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder={'Click the operations above or type directly.\nExample: mass / (molWeight × volume)'}
              rows={3}
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
            />
            {expression && (
              <div className="px-3 py-2 rounded-md bg-secondary/50 border border-border flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground shrink-0">Your formula:</span>
                <span className="text-sm font-mono text-foreground">{expression.replace(/\*/g, '×').replace(/\//g, '÷')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 3: Test */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 3 — Test It</h3>
          </div>
          {testPassed === true && (
            <span className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--success))]">
              <Check className="w-3.5 h-3.5" /> Looks good!
            </span>
          )}
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">Put in some sample numbers to make sure your formula gives the right answer.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {variables.map(v => (
              <div key={v.id} className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {v.name} {v.description && <span className="normal-case">({v.description})</span>}
                </label>
                <input
                  type="number"
                  value={v.testValue}
                  onChange={ev => updateVariable(v.id, 'testValue', ev.target.value)}
                  placeholder="Enter a number"
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>

          <button
            onClick={testFormula}
            disabled={!expression.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" /> Test Formula
          </button>

          {testError && (
            <div className="px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {testError}
            </div>
          )}

          {testResult !== null && (
            <div className="px-5 py-4 rounded-md bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 flex items-center gap-3">
              <Check className="w-5 h-5 text-[hsl(var(--success))]" />
              <div>
                <p className="text-xs text-muted-foreground">Answer:</p>
                <p className="font-mono text-xl font-bold text-foreground">{testResult}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 4: Name & Save */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <Save className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Step 4 — Save Your Formula</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Formula Name *</label>
            <input
              value={formulaName}
              onChange={ev => setFormulaName(ev.target.value)}
              placeholder="e.g. Calculate Molarity from Mass"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Description — what does it do?</label>
            <textarea
              value={formulaDesc}
              onChange={ev => setFormulaDesc(ev.target.value)}
              placeholder="Describe when you'd use this formula and what it calculates..."
              rows={2}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveFormula}
              disabled={!formulaName.trim() || !expression.trim() || testPassed !== true}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" /> {editingFormulaId ? 'Update Formula' : 'Save Formula'}
            </button>
            {editingFormulaId && (
              <button
                onClick={resetBuilder}
                className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel Edit
              </button>
            )}
          </div>
          {editingFormulaId && (
            <p className="text-[10px] text-primary">✏ Editing "{formulaName}" — changes will update the existing formula</p>
          )}
          {testPassed !== true && expression.trim() && (
            <p className="text-[10px] text-[hsl(var(--warning))]">⚠ Test the formula first before saving</p>
          )}
        </div>
      </div>
      </>
      )}

      {/* Saved Formulas */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">My Formulas</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">{savedFormulas.length} saved</span>
        </div>
        <div className="p-5">
          {savedFormulas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No formulas saved yet. Create your first one above!</p>
          ) : (
            <div className="space-y-2">
              {savedFormulas.map(f => (
                <div key={f.id} className="rounded-md border border-border hover:border-primary/30 transition-colors overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedFormula(expandedFormula === f.id ? null : f.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{f.name}</p>
                      <p className="text-xs font-mono text-primary mt-0.5 truncate">{f.expression.replace(/\*/g, '×').replace(/\//g, '÷')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {isAdmin && (
                        <>
                          <button
                            onClick={ev => { ev.stopPropagation(); loadFormula(f); }}
                            className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={ev => { ev.stopPropagation(); duplicateFormula(f); }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors"
                            title="Duplicate formula"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={ev => { ev.stopPropagation(); deleteFormula(f.id); }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {expandedFormula === f.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedFormula === f.id && (
                    <div className="px-4 pb-3 space-y-2 border-t border-border/50 pt-2">
                      {f.description && (
                        <p className="text-xs text-muted-foreground">{f.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {f.variables.map(v => (
                          <span key={v.id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                            {v.name}{v.description ? ` — ${v.description}` : ''}{v.defaultValue ? ` (=${v.defaultValue})` : ''}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Saved {new Date(f.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
