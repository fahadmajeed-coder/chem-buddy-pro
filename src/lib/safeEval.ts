// Safe arithmetic expression evaluator.
// Replaces `new Function(...)` to prevent arbitrary code execution from
// user-saved formulas, SOPs, or shared/imported bundles.
//
// Supports: + - * / % ^ ** , parentheses, unary -/+, numeric literals,
// named variables (already substituted by callers), and a whitelisted
// set of math functions: sqrt, abs, log, log10, ln, exp, pow, min, max,
// round, floor, ceil, sin, cos, tan, asin, acos, atan, atan2, sign.
// Constants: PI, E.

type Token =
  | { t: 'num'; v: number }
  | { t: 'ident'; v: string }
  | { t: 'op'; v: string }
  | { t: 'lp' }
  | { t: 'rp' }
  | { t: 'comma' };

const FUNCS: Record<string, (...a: number[]) => number> = {
  sqrt: Math.sqrt, abs: Math.abs, log: Math.log10, log10: Math.log10,
  ln: Math.log, exp: Math.exp, pow: Math.pow,
  min: Math.min, max: Math.max, round: Math.round,
  floor: Math.floor, ceil: Math.ceil,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
  sign: Math.sign,
  // Variadic statistical helpers
  sum: (...a) => a.reduce((s, v) => s + v, 0),
  average: (...a) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN,
  mean: (...a) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN,
  stdDev: (...a) => {
    if (a.length < 2) return NaN;
    const m = a.reduce((s, v) => s + v, 0) / a.length;
    return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
  },
  // Chemistry domain helpers (mirror the ones from toJavaScript rewrites)
  percentYield: (actual, theoretical) => (actual / theoretical) * 100,
  percentPurity: (pure, total) => (pure / total) * 100,
  percentError: (exp, theo) => Math.abs((exp - theo) / theo) * 100,
  percentDiff: (a, b) => Math.abs(a - b) / ((a + b) / 2) * 100,
  percentRecovery: (final, initial) => (final / initial) * 100,
  molarity: (mol, L) => mol / L,
  normality: (mol, L, n) => (mol * n) / L,
  dilution: (c1, v1, v2) => (c1 * v1) / v2,
  pH: (h) => -Math.log10(h),
  pOH: (oh) => -Math.log10(oh),
};

const CONSTS: Record<string, number> = {
  PI: Math.PI, E: Math.E,
};

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
    if ((c >= '0' && c <= '9') || c === '.') {
      let j = i;
      while (j < src.length && /[0-9.eE+\-]/.test(src[j])) {
        // allow exponent sign only directly after e/E
        if ((src[j] === '+' || src[j] === '-') && j > i && !/[eE]/.test(src[j - 1])) break;
        j++;
      }
      const num = parseFloat(src.slice(i, j));
      if (!Number.isFinite(num)) throw new Error(`Invalid number near "${src.slice(i, j)}"`);
      out.push({ t: 'num', v: num });
      i = j;
      continue;
    }
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_') {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      out.push({ t: 'ident', v: src.slice(i, j) });
      i = j;
      continue;
    }
    if (c === '(' ) { out.push({ t: 'lp' }); i++; continue; }
    if (c === ')') { out.push({ t: 'rp' }); i++; continue; }
    if (c === ',') { out.push({ t: 'comma' }); i++; continue; }
    if (c === '*' && src[i + 1] === '*') { out.push({ t: 'op', v: '^' }); i += 2; continue; }
    if ('+-*/%^'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    throw new Error(`Unexpected character "${c}"`);
  }
  return out;
}

// Pratt-style parser + evaluator
function parse(tokens: Token[], vars: Record<string, number>): number {
  let p = 0;
  const peek = () => tokens[p];
  const eat = () => tokens[p++];

  function parseExpr(rbp = 0): number {
    let left = parseNud();
    while (p < tokens.length) {
      const tk = peek();
      if (tk.t === 'op') {
        const lbp = BP[tk.v] || 0;
        if (lbp <= rbp) break;
        eat();
        const right = parseExpr(tk.v === '^' ? lbp - 1 : lbp); // right-assoc for ^
        left = apply(tk.v, left, right);
      } else break;
    }
    return left;
  }
  function parseNud(): number {
    const tk = eat();
    if (!tk) throw new Error('Unexpected end of expression');
    if (tk.t === 'num') return tk.v;
    if (tk.t === 'op' && (tk.v === '-' || tk.v === '+')) {
      const v = parseExpr(100);
      return tk.v === '-' ? -v : v;
    }
    if (tk.t === 'lp') {
      const v = parseExpr(0);
      const n = eat();
      if (!n || n.t !== 'rp') throw new Error('Missing ")"');
      return v;
    }
    if (tk.t === 'ident') {
      const name = tk.v;
      // function call?
      if (peek()?.t === 'lp') {
        eat(); // lp
        const args: number[] = [];
        if (peek()?.t !== 'rp') {
          args.push(parseExpr(0));
          while (peek()?.t === 'comma') { eat(); args.push(parseExpr(0)); }
        }
        const cl = eat();
        if (!cl || cl.t !== 'rp') throw new Error('Missing ")" after function args');
        const fn = FUNCS[name] || FUNCS[name.toLowerCase()];
        if (!fn) throw new Error(`Unknown function "${name}"`);
        return fn(...args);
      }
      if (name in CONSTS) return CONSTS[name];
      if (name in vars) return vars[name];
      // try case-insensitive
      const lk = Object.keys(vars).find(k => k.toLowerCase() === name.toLowerCase());
      if (lk) return vars[lk];
      throw new Error(`Unknown variable "${name}"`);
    }
    throw new Error(`Unexpected token`);
  }
  const v = parseExpr(0);
  if (p !== tokens.length) throw new Error('Trailing input');
  return v;
}

const BP: Record<string, number> = {
  '+': 10, '-': 10, '*': 20, '/': 20, '%': 20, '^': 30,
};

function apply(op: string, a: number, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return a / b;
    case '%': return a % b;
    case '^': return Math.pow(a, b);
  }
  throw new Error(`Unknown operator ${op}`);
}

/**
 * Safely evaluate a math expression. Throws on parse error / unknown identifier.
 * Variables already substituted into `vars` (e.g. { SW: 5, TR: 2.1 }).
 * Accepts both bare (`sqrt(x)`) and JS-style (`Math.sqrt(x)`) function calls.
 */
export function safeEval(expression: string, vars: Record<string, number> = {}): number {
  if (!expression || !expression.trim()) throw new Error('Empty expression');
  if (expression.length > 4000) throw new Error('Expression too long');
  // Normalize Math.X → X so JS-style and bare-style both work
  const normalized = expression.replace(/\bMath\./g, '');
  const tokens = tokenize(normalized);
  return parse(tokens, vars);
}

/**
 * Drop-in replacement for `new Function(\`return (${expr})\`)()` where the
 * expression has already had variables substituted as numeric literals.
 */
export function safeEvalLiteral(expression: string): number {
  return safeEval(expression, {});
}
