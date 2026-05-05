// Simple Big-M Simplex LP Solver for least-cost feed formulation
// Minimize c^T x subject to Ax {<=,>=,=} b, with x_i in [lb_i, ub_i]

export type ConstraintType = '<=' | '>=' | '=';

export interface LPConstraint {
  coeffs: number[]; // length = nVars
  type: ConstraintType;
  rhs: number;
  name?: string;
}

export interface LPProblem {
  c: number[]; // cost coefficients (minimize)
  lb: number[]; // lower bounds (>=0)
  ub: number[]; // upper bounds (Infinity allowed)
  constraints: LPConstraint[];
  varNames?: string[];
}

export interface LPSolution {
  status: 'optimal' | 'infeasible' | 'unbounded';
  x: number[];
  objective: number;
  // shadow prices (dual values) per constraint
  shadowPrices: number[];
  // reduced costs per variable
  reducedCosts: number[];
  message?: string;
}

// Substitute x_i = lb_i + y_i (y_i >= 0, y_i <= ub_i - lb_i)
// Then standard form with slack/surplus + artificial vars (Big-M)
export function solveLP(prob: LPProblem): LPSolution {
  const n = prob.c.length;
  const lb = prob.lb.slice();
  const ub = prob.ub.slice();
  const c = prob.c.slice();

  // Shift: y_i = x_i - lb_i
  // New objective constant = sum(c_i * lb_i)
  let constObj = 0;
  for (let i = 0; i < n; i++) constObj += c[i] * lb[i];

  // Constraints adjusted: A*(y+lb) {op} b  =>  A*y {op} b - A*lb
  const adjConstraints: LPConstraint[] = prob.constraints.map(con => {
    let shift = 0;
    for (let i = 0; i < n; i++) shift += con.coeffs[i] * lb[i];
    return { ...con, coeffs: con.coeffs.slice(), rhs: con.rhs - shift };
  });

  // Add upper bound constraints y_i <= ub_i - lb_i (for finite ub)
  for (let i = 0; i < n; i++) {
    if (isFinite(ub[i])) {
      const coeffs = new Array(n).fill(0);
      coeffs[i] = 1;
      adjConstraints.push({ coeffs, type: '<=', rhs: ub[i] - lb[i], name: `ub_${i}` });
    }
  }

  // Ensure all rhs >= 0; flip if not
  for (const con of adjConstraints) {
    if (con.rhs < 0) {
      con.rhs = -con.rhs;
      con.coeffs = con.coeffs.map(v => -v);
      if (con.type === '<=') con.type = '>=';
      else if (con.type === '>=') con.type = '<=';
    }
  }

  const m = adjConstraints.length;
  // Build tableau columns: [y_1..y_n | slacks | artificials | RHS]
  const M = 1e7;
  // Determine slack/artificial counts
  const slackInfo: { row: number; isArtificial: boolean; sign: number }[] = [];
  let nSlack = 0, nArt = 0;
  const rowSlackIdx: number[] = []; // slack column index per row (or -1)
  const rowArtIdx: number[] = []; // artificial column index per row (or -1)
  for (let i = 0; i < m; i++) {
    const t = adjConstraints[i].type;
    if (t === '<=') { nSlack++; }
    else if (t === '>=') { nSlack++; nArt++; }
    else { nArt++; }
  }
  const totalCols = n + nSlack + nArt + 1;
  const tab: number[][] = Array.from({ length: m + 1 }, () => new Array(totalCols).fill(0));
  let sCol = n, aCol = n + nSlack;
  const basis: number[] = new Array(m).fill(-1);
  const cVec = new Array(totalCols - 1).fill(0);
  for (let j = 0; j < n; j++) cVec[j] = c[j];

  for (let i = 0; i < m; i++) {
    const con = adjConstraints[i];
    for (let j = 0; j < n; j++) tab[i][j] = con.coeffs[j];
    tab[i][totalCols - 1] = con.rhs;
    if (con.type === '<=') {
      tab[i][sCol] = 1;
      basis[i] = sCol;
      rowSlackIdx.push(sCol); rowArtIdx.push(-1);
      sCol++;
    } else if (con.type === '>=') {
      tab[i][sCol] = -1;
      tab[i][aCol] = 1;
      basis[i] = aCol;
      cVec[aCol] = M;
      rowSlackIdx.push(sCol); rowArtIdx.push(aCol);
      sCol++; aCol++;
    } else {
      tab[i][aCol] = 1;
      basis[i] = aCol;
      cVec[aCol] = M;
      rowSlackIdx.push(-1); rowArtIdx.push(aCol);
      aCol++;
    }
  }

  // Objective row (z - c^T x = 0). We'll compute reduced costs each iteration.
  // Use revised tableau approach: maintain z_j - c_j and rhs of z.
  // Initial z: z = c_B^T B^-1 b ; we'll just compute via iterative pivots from artificial basis.
  const objRow = new Array(totalCols).fill(0);
  // Build initial reduced row: z_j - c_j where z_j = c_B * column j
  const recomputeObj = () => {
    for (let j = 0; j < totalCols; j++) {
      let zj = 0;
      for (let i = 0; i < m; i++) zj += cVec[basis[i]] * tab[i][j];
      objRow[j] = (j === totalCols - 1) ? zj : (zj - (j < totalCols - 1 ? cVec[j] : 0));
    }
  };

  recomputeObj();

  const maxIter = 500 + 50 * (n + m);
  let iter = 0;
  while (iter++ < maxIter) {
    // Find entering: most positive reduced cost (since we're minimizing and using zj-cj, positive means improvement when minimizing? No.)
    // For minimization with z_j - c_j: optimal when all z_j - c_j <= 0. Entering = max positive.
    let pivotCol = -1; let best = 1e-9;
    for (let j = 0; j < totalCols - 1; j++) {
      if (objRow[j] > best) { best = objRow[j]; pivotCol = j; }
    }
    if (pivotCol === -1) break; // optimal

    // Min ratio test
    let pivotRow = -1; let minRatio = Infinity;
    for (let i = 0; i < m; i++) {
      if (tab[i][pivotCol] > 1e-9) {
        const r = tab[i][totalCols - 1] / tab[i][pivotCol];
        if (r < minRatio - 1e-12) { minRatio = r; pivotRow = i; }
      }
    }
    if (pivotRow === -1) {
      return { status: 'unbounded', x: [], objective: NaN, shadowPrices: [], reducedCosts: [], message: 'Unbounded' };
    }

    // Pivot
    const piv = tab[pivotRow][pivotCol];
    for (let j = 0; j < totalCols; j++) tab[pivotRow][j] /= piv;
    for (let i = 0; i < m; i++) {
      if (i === pivotRow) continue;
      const f = tab[i][pivotCol];
      if (Math.abs(f) > 1e-12) {
        for (let j = 0; j < totalCols; j++) tab[i][j] -= f * tab[pivotRow][j];
      }
    }
    basis[pivotRow] = pivotCol;
    recomputeObj();
  }

  // Check feasibility (no artificial in basis with positive value)
  for (let i = 0; i < m; i++) {
    if (basis[i] >= n + nSlack && tab[i][totalCols - 1] > 1e-6) {
      return { status: 'infeasible', x: [], objective: NaN, shadowPrices: [], reducedCosts: [], message: 'No feasible solution' };
    }
  }

  // Extract y values, then x = y + lb
  const y = new Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    if (basis[i] < n) y[basis[i]] = tab[i][totalCols - 1];
  }
  const x = y.map((yi, i) => yi + lb[i]);

  // Objective
  let obj = constObj;
  for (let i = 0; i < n; i++) obj += c[i] * y[i];

  // Shadow prices: only for original constraints (first prob.constraints.length rows pre-shift)
  // After flip we may have changed sign. Compute c_B * B^-1 from slacks of original constraints.
  // For each original constraint i (0..origM-1), shadow price = z_j - c_j in the slack column corresponding.
  // For >= constraints we used surplus -1; price = -objRow[slackCol]
  // For <= : price = objRow[slackCol]
  const origM = prob.constraints.length;
  const shadowPrices: number[] = [];
  for (let i = 0; i < origM; i++) {
    const sIdx = rowSlackIdx[i];
    const aIdx = rowArtIdx[i];
    let dual = 0;
    if (sIdx >= 0) {
      const z = objRow[sIdx];
      dual = adjConstraints[i].type === '<=' ? z : -z;
    } else if (aIdx >= 0) {
      // = constraint, use artificial column
      dual = objRow[aIdx] - M;
    }
    shadowPrices.push(dual);
  }

  // Reduced costs for original variables
  const reducedCosts: number[] = [];
  for (let j = 0; j < n; j++) reducedCosts.push(-objRow[j]);

  return { status: 'optimal', x, objective: obj, shadowPrices, reducedCosts };
}
