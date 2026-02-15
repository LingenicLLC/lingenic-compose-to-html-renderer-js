/**
 * lingenic-compose-html-renderer v0.1.0
 * Lingenic Compose → HTML renderer with KaTeX math support.
 * https://compose.lingenic.com
 * License: MIT
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ComposeRenderer = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

/**
 * compose-math.js
 * Compose Unicode Math → LaTeX string converter.
 * Follows the official math-to-katex.compose mapping specification.
 *
 * Conversion order (per spec):
 *  1. Structure: .fraction, .matrix, .cases, .begin-math-align → LaTeX envs
 *  2. Bounds: _(content) and ^(content) → _{content} ^{content}
 *  3. Roots: √() ∛ ∜
 *  4. Fractions: (num) / (denom) → \frac
 *  5. Decorations: combining chars → \hat \bar \dot \vec etc.
 *  6. Unicode super/subscripts → ^{} _{}
 *  7. Symbols: Greek, operators, relations, sets → LaTeX commands
 *  8. Math italic vars: 𝑥 → x etc.
 *  9. Functions: sin cos lim → \sin \cos \lim
 * 10. Spacing commands → LaTeX spacing
 */

// ── Character Maps ──

const GREEK_LOWER = {
  'α':'\\alpha','β':'\\beta','γ':'\\gamma','δ':'\\delta',
  'ε':'\\varepsilon','ζ':'\\zeta','η':'\\eta','θ':'\\theta',
  'ι':'\\iota','κ':'\\kappa','λ':'\\lambda','μ':'\\mu',
  'ν':'\\nu','ξ':'\\xi','π':'\\pi','ρ':'\\rho',
  'σ':'\\sigma','τ':'\\tau','υ':'\\upsilon','φ':'\\varphi',
  'χ':'\\chi','ψ':'\\psi','ω':'\\omega'
};

const GREEK_UPPER = {
  'Γ':'\\Gamma','Δ':'\\Delta','Θ':'\\Theta','Λ':'\\Lambda',
  'Ξ':'\\Xi','Π':'\\Pi','Σ':'\\Sigma','Φ':'\\Phi',
  'Ψ':'\\Psi','Ω':'\\Omega'
};

// Unicode Mathematical Italic (U+1D400 block) → ASCII
const MATH_ITALIC = {
  '𝑎':'a','𝑏':'b','𝑐':'c','𝑑':'d','𝑒':'e','𝑓':'f','𝑔':'g','𝑕':'h',
  '𝑖':'i','𝑗':'j','𝑘':'k','𝑙':'l','𝑚':'m','𝑛':'n','𝑜':'o','𝑝':'p',
  '𝑞':'q','𝑟':'r','𝑠':'s','𝑡':'t','𝑢':'u','𝑣':'v','𝑤':'w','𝑥':'x',
  '𝑦':'y','𝑧':'z',
  '𝐴':'A','𝐵':'B','𝐶':'C','𝐷':'D','𝐸':'E','𝐹':'F','𝐺':'G','𝐻':'H',
  '𝐼':'I','𝐽':'J','𝐾':'K','𝐿':'L','𝑀':'M','𝑁':'N','𝑂':'O','𝑃':'P',
  '𝑄':'Q','𝑅':'R','𝑆':'S','𝑇':'T','𝑈':'U','𝑉':'V','𝑊':'W','𝑋':'X',
  '𝑌':'Y','𝑍':'Z'
};

const SUPERSCRIPTS = {
  '⁰':'^{0}','¹':'^{1}','²':'^{2}','³':'^{3}','⁴':'^{4}',
  '⁵':'^{5}','⁶':'^{6}','⁷':'^{7}','⁸':'^{8}','⁹':'^{9}',
  'ⁿ':'^{n}','ⁱ':'^{i}'
};

const SUBSCRIPTS = {
  '₀':'_{0}','₁':'_{1}','₂':'_{2}','₃':'_{3}','₄':'_{4}',
  '₅':'_{5}','₆':'_{6}','₇':'_{7}','₈':'_{8}','₉':'_{9}',
  'ₐ':'_{a}','ₑ':'_{e}','ₕ':'_{h}','ᵢ':'_{i}','ⱼ':'_{j}',
  'ₖ':'_{k}','ₗ':'_{l}','ₘ':'_{m}','ₙ':'_{n}','ₒ':'_{o}',
  'ₚ':'_{p}','ᵣ':'_{r}','ₛ':'_{s}','ₜ':'_{t}','ᵤ':'_{u}',
  'ᵥ':'_{v}','ₓ':'_{x}'
};

const SYMBOLS = {
  '×':'\\times','÷':'\\div','±':'\\pm','∓':'\\mp',
  '·':'\\cdot','∘':'\\circ','⊗':'\\otimes','⊕':'\\oplus',
  '−':'-',
  '∑':'\\sum','∏':'\\prod','∫':'\\int','∬':'\\iint',
  '∭':'\\iiint','∮':'\\oint','∂':'\\partial','∇':'\\nabla',
  '≠':'\\neq','≤':'\\leq','≥':'\\geq','≪':'\\ll','≫':'\\gg',
  '≈':'\\approx','≡':'\\equiv','∝':'\\propto','≺':'\\prec',
  '≻':'\\succ','∼':'\\sim','≃':'\\simeq','≅':'\\cong',
  '∈':'\\in','∉':'\\notin','∋':'\\ni',
  '⊂':'\\subset','⊃':'\\supset','⊆':'\\subseteq','⊇':'\\supseteq',
  '∪':'\\cup','∩':'\\cap','∅':'\\emptyset','∖':'\\setminus',
  '→':'\\to','←':'\\leftarrow','↔':'\\leftrightarrow',
  '⇒':'\\Rightarrow','⇐':'\\Leftarrow','⇔':'\\Leftrightarrow',
  '↦':'\\mapsto','↑':'\\uparrow','↓':'\\downarrow',
  '⟶':'\\longrightarrow','⟹':'\\Longrightarrow',
  '∀':'\\forall','∃':'\\exists','¬':'\\neg',
  '∧':'\\land','∨':'\\lor','⊢':'\\vdash','⊨':'\\models',
  '⊥':'\\bot','⊤':'\\top',
  '∞':'\\infty','ℓ':'\\ell','ℏ':'\\hbar',
  '†':'\\dagger','‡':'\\ddagger',
  '⋯':'\\cdots','⋮':'\\vdots','⋱':'\\ddots','…':'\\ldots',
  '∴':'\\therefore','∵':'\\because',
  'ℕ':'\\mathbb{N}','ℤ':'\\mathbb{Z}','ℚ':'\\mathbb{Q}',
  'ℝ':'\\mathbb{R}','ℂ':'\\mathbb{C}','ℍ':'\\mathbb{H}',
  '⌊':'\\lfloor','⌋':'\\rfloor','⌈':'\\lceil','⌉':'\\rceil',
  '⟨':'\\langle','⟩':'\\rangle','‖':'\\|'
};

// Combining character decorations (U+0300 block, U+20D7)
const COMBINING = {
  '\u0302': 'hat',   // circumflex
  '\u0304': 'bar',   // overline
  '\u0307': 'dot',   // dot above
  '\u0308': 'ddot',  // diaeresis
  '\u0303': 'tilde', // tilde
  '\u20D7': 'vec'    // arrow
};

const FUNCTIONS = [
  'arccos','arcsin','arctan','arg','cos','cosh','cot','coth','csc',
  'deg','det','dim','exp','gcd','hom','inf','ker','lg','lim','liminf',
  'limsup','ln','log','max','min','sec','sin','sinh','sup','tan','tanh'
];

// ── Helpers ──

/** Find matching closing paren for an opening paren at pos */
function matchParen(s, pos) {
  let depth = 1;
  for (let i = pos + 1; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

/** Replace all entries from a map in a string */
function replaceMap(s, map) {
  for (const [from, to] of Object.entries(map)) {
    s = s.replaceAll(from, to + ' ');
  }
  return s;
}

// ── Main Converter ──

/**
 * Convert a Compose math expression string to a LaTeX string.
 * @param {string} expr - Compose Unicode math expression
 * @returns {string} LaTeX string suitable for KaTeX
 */
function composeToLatex(expr) {
  let s = expr.trim();

  // Step 2: ^(content) → ^{content}, _(content) → _{content}
  // Must handle nested parens
  let result = '';
  let i = 0;
  while (i < s.length) {
    if ((s[i] === '^' || s[i] === '_') && s[i + 1] === '(') {
      const closer = matchParen(s, i + 1);
      if (closer !== -1) {
        const inner = s.slice(i + 2, closer);
        result += s[i] + '{' + inner + '}';
        i = closer + 1;
        continue;
      }
    }
    result += s[i];
    i++;
  }
  s = result;

  // Step 3: Roots
  // √(content) → \sqrt{content}
  s = s.replace(/√\(([^)]*(?:\([^)]*\))*[^)]*)\)/g, '\\sqrt{$1}');
  s = s.replace(/√(\w)/g, '\\sqrt{$1}');
  s = s.replace(/∛\(([^)]+)\)/g, '\\sqrt[3]{$1}');
  s = s.replace(/∛([a-zA-Z0-9])/g, '\\sqrt[3]{$1}');
  s = s.replace(/∜\(([^)]+)\)/g, '\\sqrt[4]{$1}');
  s = s.replace(/∜([a-zA-Z0-9])/g, '\\sqrt[4]{$1}');

  // Step 4: Inline fractions (num) / (denom) → \frac{num}{denom}
  s = s.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');

  // Step 5: Combining character decorations
  for (const [codepoint, cmd] of Object.entries(COMBINING)) {
    const re = new RegExp(`(.)${codepoint}`, 'g');
    s = s.replace(re, `\\${cmd}{$1}`);
  }

  // Step 6: Unicode super/subscripts
  for (const [from, to] of Object.entries(SUPERSCRIPTS)) s = s.replaceAll(from, to);
  for (const [from, to] of Object.entries(SUBSCRIPTS)) s = s.replaceAll(from, to);

  // Step 7: Symbols (Greek first, then operators/relations/sets)
  for (const [from, to] of Object.entries(GREEK_LOWER)) s = s.replaceAll(from, to + ' ');
  for (const [from, to] of Object.entries(GREEK_UPPER)) s = s.replaceAll(from, to + ' ');
  for (const [from, to] of Object.entries(SYMBOLS)) s = s.replaceAll(from, to + ' ');

  // Step 8: Math italic → ASCII
  for (const [from, to] of Object.entries(MATH_ITALIC)) s = s.replaceAll(from, to);

  // Step 9: Functions → \func
  // Use lookahead that handles _ ^ { ( and whitespace as boundaries
  for (const fn of FUNCTIONS) {
    s = s.replace(new RegExp(`(?<![a-zA-Z\\\\])${fn}(?=[^a-zA-Z]|$)`, 'g'), `\\${fn}`);
  }
  // Custom functions in quotes: "erf"(x) → \operatorname{erf}(x)
  s = s.replace(/"(\w+)"/g, '\\operatorname{$1}');

  // Clean up multiple spaces
  s = s.replace(/\s{2,}/g, ' ').trim();

  return s;
}

/**
 * Render a .fraction / .numerator / .denominator structure to LaTeX
 */
function fractionToLatex(numerator, denominator) {
  return `\\frac{${composeToLatex(numerator)}}{${composeToLatex(denominator)}}`;
}

/**
 * Render a .matrix block to LaTeX
 * @param {string[]} rows - array of row strings (columns space or comma separated)
 * @param {string} [delimiters='parentheses'] - parentheses|brackets|braces|pipes|double-pipes|none
 */
function matrixToLatex(rows, delimiters = 'parentheses') {
  const envMap = {
    'parentheses': 'pmatrix', 'brackets': 'bmatrix', 'braces': 'Bmatrix',
    'pipes': 'vmatrix', 'double-pipes': 'Vmatrix', 'none': 'matrix'
  };
  const env = envMap[delimiters] || 'pmatrix';
  const body = rows.map(r => {
    const cols = r.includes(',') ? r.split(',') : r.trim().split(/\s+/);
    return cols.map(c => composeToLatex(c.trim())).join(' & ');
  }).join(' \\\\ ');
  return `\\begin{${env}} ${body} \\end{${env}}`;
}

/**
 * Render a .cases block to LaTeX
 * @param {string[]} rows - each row: "value, condition"
 */
function casesToLatex(rows) {
  const body = rows.map(r => {
    const parts = r.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return `${composeToLatex(parts[0])} & \\text{${parts.slice(1).join(',').trim()}}`;
    }
    return composeToLatex(r);
  }).join(' \\\\ ');
  return `\\begin{cases} ${body} \\end{cases}`;
}

/**
 * Render a .begin-math-align block to LaTeX
 * @param {string[]} lines - each line with & for alignment
 */
function alignToLatex(lines) {
  const body = lines.map(l => composeToLatex(l)).join(' \\\\ ');
  return `\\begin{aligned} ${body} \\end{aligned}`;
}


/**
 * compose-parser.js
 * Parses Compose source into a flat AST (array of typed nodes).
 *
 * Node types:
 *   comment, page-header, page-footer, text-title, paragraph,
 *   font-push, font-reset, underscore-on, underscore-off,
 *   align, indent, vertical-margin, space, horizontal-rule,
 *   fill-off (preformatted), literal, keep, footnote,
 *   list, math-block, math-align, set-variable, label, break-page,
 *   begin-figure, end-figure, caption, insert-graphic
 */

/**
 * @typedef {Object} ComposeNode
 * @property {string} type
 * @property {Object} [props]
 * @property {ComposeNode[]} [children]
 * @property {string} [text]
 */

/**
 * Parse a Compose source string into an array of nodes.
 * @param {string} source - raw .compose file contents
 * @returns {ComposeNode[]}
 */
function parse(source) {
  const lines = source.split('\n');
  const nodes = [];
  let i = 0;

  function peekTrimmed() {
    return i < lines.length ? lines[i].trim() : null;
  }

  function consumeLine() {
    return lines[i++];
  }

  // Collect content lines into a paragraph node (until empty line or command)
  function collectParagraph() {
    const buf = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (t === '' || t.startsWith('.')) break;
      buf.push(t);
      i++;
    }
    if (buf.length) {
      nodes.push({ type: 'paragraph', text: buf.join(' ') });
    }
  }

  // Collect lines until a closing command
  function collectUntil(endCmd) {
    const buf = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (t === endCmd || t.startsWith(endCmd + ' ')) { i++; return buf; }
      buf.push(lines[i]);
      i++;
    }
    return buf; // EOF without close — best effort
  }

  // Collect content-only lines until closing command
  function collectContentUntil(endCmd) {
    const buf = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (t === endCmd || t.startsWith(endCmd + ' ')) { i++; return buf; }
      if (!t.startsWith('.') && t !== '') buf.push(t);
      else if (t === '') { /* skip blanks */ }
      i++;
    }
    return buf;
  }

  while (i < lines.length) {
    const trimmed = peekTrimmed();
    if (trimmed === null) break;

    // Empty line — skip (paragraph boundaries handled by collectParagraph)
    if (trimmed === '') { i++; continue; }

    // Comments
    if (trimmed.startsWith('.*') || trimmed.startsWith('.~')) { i++; continue; }

    // ── Commands ──
    if (trimmed.startsWith('.')) {

      // Page header
      if (trimmed.startsWith('.begin-page-header')) {
        const parity = trimmed.includes('even') ? 'even' : trimmed.includes('odd') ? 'odd' : 'all';
        i++;
        const inner = [];
        let align = 'center';
        while (i < lines.length && !lines[i].trim().startsWith('.end-page-header')) {
          const t = lines[i].trim();
          if (t.startsWith('.align-')) align = t.replace('.align-', '');
          else if (!t.startsWith('.') && t !== '') inner.push(t);
          i++;
        }
        i++; // skip .end-page-header
        nodes.push({ type: 'page-header', props: { parity, align }, text: inner.join(' ') });
        continue;
      }

      // Page footer
      if (trimmed.startsWith('.begin-page-footer')) {
        const parity = trimmed.includes('even') ? 'even' : trimmed.includes('odd') ? 'odd' : 'all';
        i++;
        const inner = [];
        let align = 'center';
        while (i < lines.length && !lines[i].trim().startsWith('.end-page-footer')) {
          const t = lines[i].trim();
          if (t.startsWith('.align-')) align = t.replace('.align-', '');
          else if (!t.startsWith('.') && t !== '') inner.push(t);
          i++;
        }
        i++;
        nodes.push({ type: 'page-footer', props: { parity, align }, text: inner.join(' ') });
        continue;
      }

      // Text title
      if (trimmed === '.begin-text-title' || trimmed.startsWith('.begin-text-title ')) {
        i++;
        let label = '';
        const titleLines = [];
        while (i < lines.length && !lines[i].trim().startsWith('.end-text-title')) {
          const t = lines[i].trim();
          if (t.startsWith('.label ')) label = t.replace('.label ', '').trim();
          else if (!t.startsWith('.') && t !== '') titleLines.push(t);
          i++;
        }
        i++;
        nodes.push({ type: 'text-title', props: { label }, text: titleLines.join(' ') });
        continue;
      }

      // Set variable
      if (trimmed.startsWith('.set-variable ')) {
        const m = trimmed.match(/^\.set-variable\s+(\S+)\s+"?([^"]*)"?$/);
        if (m) nodes.push({ type: 'set-variable', props: { name: m[1], value: m[2] } });
        i++; continue;
      }

      // Set counter
      if (trimmed.startsWith('.set-counter ')) {
        const parts = trimmed.replace('.set-counter ', '').trim().split(/\s+/);
        const name = parts[0];
        const initial = parseInt(parts[1]) || 0;
        const byIdx = parts.indexOf('by');
        const increment = byIdx !== -1 ? parseInt(parts[byIdx + 1]) || 1 : 1;
        nodes.push({ type: 'set-counter', props: { name, initial, increment } });
        i++; continue;
      }

      // Font
      if (trimmed.startsWith('.font ')) {
        const value = trimmed.replace('.font ', '').trim();
        if (value === '-reset') nodes.push({ type: 'font-reset' });
        else nodes.push({ type: 'font-push', props: { value } });
        i++; continue;
      }

      // Underscore
      if (trimmed === '.underscore-on') { nodes.push({ type: 'underscore-on' }); i++; continue; }
      if (trimmed === '.underscore-off') { nodes.push({ type: 'underscore-off' }); i++; continue; }

      // Alignment
      if (trimmed.startsWith('.align-')) {
        nodes.push({ type: 'align', props: { value: trimmed.replace('.align-', '') } });
        i++; continue;
      }

      // Indentation
      if (trimmed.startsWith('.indent-left') || trimmed.startsWith('.indent-right') ||
          trimmed.startsWith('.indent-both') || trimmed.match(/^\.indent\s/)) {
        const m = trimmed.match(/^\.(indent(?:-\w+)?)\s*(.*)/);
        if (m) nodes.push({ type: 'indent', props: { direction: m[1], value: m[2].trim() } });
        i++; continue;
      }

      // Vertical margin
      if (trimmed.startsWith('.vertical-margin')) {
        const m = trimmed.match(/\.vertical-margin-(\w+)\s+(.*)/);
        if (m) nodes.push({ type: 'vertical-margin', props: { edge: m[1], value: m[2].trim() } });
        i++; continue;
      }

      // Space
      if (trimmed.startsWith('.space')) {
        const m = trimmed.match(/\.space\s*(\d*)/);
        const amount = m && m[1] ? parseInt(m[1]) : 1;
        nodes.push({ type: 'space', props: { amount } });
        i++; continue;
      }

      // Page break
      if (trimmed.startsWith('.break-page')) {
        nodes.push({ type: 'break-page' });
        i++; continue;
      }

      // Horizontal rule
      if (trimmed.startsWith('.horizontal-rule')) {
        const parts = trimmed.replace('.horizontal-rule', '').trim();
        let width = '100%', thickness = '1pt', style = 'solid';
        if (parts) {
          const tokens = parts.split(/\s+/);
          if (tokens[0]) width = tokens[0];
          if (tokens[1]) thickness = tokens[1];
          if (tokens[2]) style = tokens[2];
        }
        nodes.push({ type: 'horizontal-rule', props: { width, thickness, style } });
        i++; continue;
      }

      // Label (standalone)
      if (trimmed.startsWith('.label ')) {
        nodes.push({ type: 'label', props: { name: trimmed.replace('.label ', '').trim() } });
        i++; continue;
      }

      // Fill off → preformatted
      if (trimmed === '.fill-off' || trimmed.startsWith('.fill-off ')) {
        i++;
        const preLines = [];
        while (i < lines.length && lines[i].trim() !== '.fill-on') {
          preLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // skip .fill-on
        nodes.push({ type: 'preformatted', text: preLines.join('\n') });
        continue;
      }

      // Literal block
      if (trimmed === '.block-begin-literal' || trimmed.startsWith('.block-begin-literal ')) {
        i++;
        const litLines = [];
        while (i < lines.length && lines[i].trim() !== '.block-end-literal') {
          litLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++;
        nodes.push({ type: 'literal', text: litLines.join('\n') });
        continue;
      }

      // Keep block
      if (trimmed === '.block-begin-keep' || trimmed.startsWith('.block-begin-keep ')) {
        i++;
        const keepLines = collectContentUntil('.block-end-keep');
        nodes.push({ type: 'keep', text: keepLines.join(' ') });
        continue;
      }

      // Footnote
      if (trimmed === '.block-begin-footnote' || trimmed.startsWith('.block-begin-footnote ')) {
        i++;
        const fnLines = collectContentUntil('.block-end-footnote');
        nodes.push({ type: 'footnote', text: fnLines.join(' ') });
        continue;
      }

      // Figure
      if (trimmed.startsWith('.begin-figure')) {
        const m = trimmed.match(/\.begin-figure\s*(\S*)\s*(\S*)/);
        const label = m ? m[1] : '';
        const position = m ? m[2] : '';
        i++;
        const children = [];
        while (i < lines.length && !lines[i].trim().startsWith('.end-figure')) {
          const t = lines[i].trim();
          if (t.startsWith('.insert-graphic')) {
            const gm = t.match(/\.insert-graphic\s+"([^"]+)"(?:\s+alt="([^"]*)")?/);
            if (gm) children.push({ type: 'insert-graphic', props: { path: gm[1], alt: gm[2] || '' } });
          } else if (t.startsWith('.caption ')) {
            children.push({ type: 'caption', text: t.replace('.caption ', '') });
          }
          i++;
        }
        if (i < lines.length) i++;
        nodes.push({ type: 'figure', props: { label, position }, children });
        continue;
      }

      // Insert graphic (standalone)
      if (trimmed.startsWith('.insert-graphic')) {
        const gm = trimmed.match(/\.insert-graphic\s+"([^"]+)"(?:\s+alt="([^"]*)")?/);
        if (gm) nodes.push({ type: 'insert-graphic', props: { path: gm[1], alt: gm[2] || '' } });
        i++; continue;
      }

      // Lists
      if (trimmed.startsWith('.begin-list')) {
        nodes.push(parseList());
        continue;
      }

      // Block math
      if (trimmed === '.begin-math' || trimmed.startsWith('.begin-math ')) {
        const labelMatch = trimmed.match(/label=(\S+)/);
        const mathLabel = labelMatch ? labelMatch[1] : '';
        i++;
        nodes.push(parseMathBlock(mathLabel));
        continue;
      }

      // Math align
      if (trimmed === '.begin-math-align') {
        i++;
        const alignLines = [];
        while (i < lines.length && lines[i].trim() !== '.end-math-align') {
          const t = lines[i].trim();
          if (t && !t.startsWith('.')) alignLines.push(t);
          i++;
        }
        if (i < lines.length) i++;
        nodes.push({ type: 'math-align', props: { lines: alignLines } });
        continue;
      }

      // Endnote
      if (trimmed === '.begin-endnote') {
        i++;
        const enLines = collectContentUntil('.end-endnote');
        nodes.push({ type: 'endnote', text: enLines.join(' ') });
        continue;
      }

      // Sidenote
      if (trimmed === '.begin-sidenote') {
        i++;
        const snLines = collectContentUntil('.end-sidenote');
        nodes.push({ type: 'sidenote', text: snLines.join(' ') });
        continue;
      }

      // Language
      if (trimmed.startsWith('.language ')) {
        nodes.push({ type: 'language', props: { code: trimmed.replace('.language ', '').trim() } });
        i++; continue;
      }

      // Drop cap
      if (trimmed.startsWith('.drop-cap')) {
        const m = trimmed.match(/\.drop-cap\s*(\d*)/);
        nodes.push({ type: 'drop-cap', props: { lines: m && m[1] ? parseInt(m[1]) : 3 } });
        i++; continue;
      }

      // Any other dot-command → skip gracefully
      i++; continue;
    }

    // ── Content lines → paragraph ──
    collectParagraph();
  }

  return nodes;

  // ── Sub-parsers ──

  function parseList() {
    const typeLine = lines[i].trim();
    let listType = 'bulleted';
    if (typeLine.includes('numbered')) listType = 'numbered';
    else if (typeLine.includes('definition')) listType = 'definition';
    i++;

    const items = [];
    while (i < lines.length && lines[i].trim() !== '.end-list') {
      const t = lines[i].trim();

      if (t.startsWith('.list-item ')) {
        const text = t.replace('.list-item ', '');
        i++;
        // Check for nested list
        let nested = null;
        if (i < lines.length && lines[i].trim().startsWith('.begin-list')) {
          nested = parseList();
        }
        items.push({ type: 'list-item', text, children: nested ? [nested] : [] });
        continue;
      }

      if (t.startsWith('.list-term ')) {
        const term = t.replace('.list-term ', '');
        i++;
        let def = '';
        if (i < lines.length && lines[i].trim().startsWith('.list-definition ')) {
          def = lines[i].trim().replace('.list-definition ', '');
          i++;
        }
        items.push({ type: 'definition-item', props: { term, definition: def } });
        continue;
      }

      i++;
    }
    if (i < lines.length) i++; // skip .end-list

    return { type: 'list', props: { listType }, children: items };
  }

  function parseMathBlock(label) {
    let hasFraction = false, hasMatrix = false, hasCases = false;
    let numerator = '', denominator = '';
    let matrixRows = [], matrixDelimiters = 'parentheses';
    let casesRows = [];
    let mathLines = [];
    let inMatrix = false, inCases = false;

    while (i < lines.length && lines[i].trim() !== '.end-math') {
      const t = lines[i].trim();

      if (t === '.fraction') { hasFraction = true; i++; continue; }
      if (t.startsWith('.numerator')) { numerator = t.replace('.numerator', '').trim(); i++; continue; }
      if (t.startsWith('.denominator')) { denominator = t.replace('.denominator', '').trim(); i++; continue; }

      if (t === '.matrix' || t.startsWith('.matrix ')) {
        hasMatrix = true; inMatrix = true;
        const dm = t.match(/delimiters=(\S+)/);
        if (dm) matrixDelimiters = dm[1];
        i++; continue;
      }
      if (t === '.end-matrix') { inMatrix = false; i++; continue; }

      if (t === '.cases' || t.startsWith('.cases')) { hasCases = true; inCases = true; i++; continue; }
      if (t === '.end-cases') { inCases = false; i++; continue; }

      if (inMatrix) { matrixRows.push(t); i++; continue; }
      if (inCases) { casesRows.push(t); i++; continue; }

      if (!t.startsWith('.') && t !== '') mathLines.push(t);
      i++;
    }
    if (i < lines.length) i++; // skip .end-math

    return {
      type: 'math-block',
      props: {
        label,
        hasFraction, numerator, denominator,
        hasMatrix, matrixRows, matrixDelimiters,
        hasCases, casesRows,
        expression: mathLines.join(' ')
      }
    };
  }
}


/**
 * compose-html.js
 * Renders a parsed Compose AST to HTML.
 *
 * Accepts an optional KaTeX instance for math rendering.
 * Falls back to <code> blocks when KaTeX is not available.
 */


  composeToLatex, fractionToLatex, matrixToLatex,
  casesToLatex, alignToLatex
} from './compose-math.js';

/**
 * @typedef {Object} RenderOptions
 * @property {Object} [katex]        - KaTeX instance (window.katex or imported)
 * @property {Object} [variables]    - Pre-set variables { name: value }
 * @property {string} [cssPrefix]    - CSS class prefix (default: 'cr')
 * @property {boolean} [wrapPage]    - Wrap output in a page container div (default: true)
 * @property {string} [baseUrl]      - Base URL for resolving image paths
 */

/**
 * Render an AST (from compose-parser) to an HTML string.
 * @param {import('./compose-parser.js').ComposeNode[]} nodes
 * @param {RenderOptions} [opts]
 * @returns {string} HTML string
 */
function renderToHTML(nodes, opts = {}) {
  const katex = opts.katex || (typeof window !== 'undefined' ? window.katex : null);
  const pfx = opts.cssPrefix || 'cr';
  const wrapPage = opts.wrapPage !== false;
  const baseUrl = opts.baseUrl || '';

  // State
  const variables = {
    PageNo: '1',
    Date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    Time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    InputFileName: '',
    ...opts.variables
  };
  const counters = {};
  let fontStack = [];
  let underscoreOn = false;
  let currentAlign = '';
  let currentIndent = '';
  let currentLang = '';
  let pendingDropCap = 0;

  let pageHeader = null;
  let pageFooter = null;

  // ── Inline processing ──

  function escapeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderKatexSafe(latex, displayMode) {
    if (katex) {
      try {
        return katex.renderToString(latex, { displayMode, throwOnError: false });
      } catch (_) { /* fall through */ }
    }
    return `<code class="${pfx}-math-fallback">${escapeHTML(latex)}</code>`;
  }

  function resolveInline(text) {
    let s = escapeHTML(text);

    // %ref: name% and %ref: name page%
    s = s.replace(/%ref:\s*(\S+?)(\s+page)?(\s+number)?(\s+title)?%/g, (_, name, pg, num, title) => {
      const display = name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const suffix = pg ? ' (page)' : num ? ' (#)' : title ? ' (title)' : '';
      return `<a href="#${name}" class="${pfx}-ref">${display}${suffix}</a>`;
    });

    // %cite: key% (simplified)
    s = s.replace(/%cite:\s*(.+?)%/g, (_, key) => {
      return `<span class="${pfx}-cite">[${escapeHTML(key.trim())}]</span>`;
    });

    // %math: expr %  (inline typeset)
    s = s.replace(/%math:\s*(.+?)\s*%/g, (_, expr) => {
      const latex = composeToLatex(expr);
      return `<span class="${pfx}-math-inline">${renderKatexSafe(latex, false)}</span>`;
    });

    // %math(expr)%  (inline evaluated — we typeset; true eval needs a CAS)
    s = s.replace(/%math\((.+?)\)%/g, (_, expr) => {
      const latex = composeToLatex(expr);
      return `<span class="${pfx}-math-inline">${renderKatexSafe(latex, false)}</span>`;
    });

    // %ruby: base "annotation"% 
    s = s.replace(/%ruby:\s*(.+?)\s+"(.+?)"%/g, (_, base, ann) => {
      return `<ruby>${escapeHTML(base)}<rp>(</rp><rt>${escapeHTML(ann)}</rt><rp>)</rp></ruby>`;
    });

    // Counters — auto-increment on use
    for (const [name, counter] of Object.entries(counters)) {
      const token = `%${name}%`;
      if (s.includes(token)) {
        s = s.replaceAll(token, `<span class="${pfx}-counter">${formatCounter(counter)}</span>`);
        counter.value += counter.increment;
      }
    }

    // Variables %name%
    for (const [name, value] of Object.entries(variables)) {
      s = s.replaceAll(`%${escapeHTML(name)}%`, `<span class="${pfx}-var">${escapeHTML(String(value))}</span>`);
    }

    return s;
  }

  function formatCounter(counter) {
    const v = counter.value;
    switch (counter.mode) {
      case 'roman': return toRoman(v).toLowerCase();
      case 'Roman': return toRoman(v);
      case 'alpha': return String.fromCharCode(96 + ((v - 1) % 26) + 1);
      case 'Alpha': return String.fromCharCode(64 + ((v - 1) % 26) + 1);
      default: return String(v);
    }
  }

  function toRoman(n) {
    const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
    let r = '';
    for (let i = 0; i < vals.length; i++) {
      while (n >= vals[i]) { r += syms[i]; n -= vals[i]; }
    }
    return r;
  }

  function styleAttr() {
    const parts = [];
    if (fontStack.includes('Bold')) parts.push('font-weight:700');
    if (fontStack.includes('Italic')) parts.push('font-style:italic');
    if (underscoreOn) parts.push('text-decoration:underline;text-underline-offset:3px');
    return parts.length ? ` style="${parts.join(';')}"` : '';
  }

  function alignClass() {
    return currentAlign ? ` ${pfx}-align-${currentAlign}` : '';
  }

  function indentClass() {
    return currentIndent ? ` ${pfx}-${currentIndent}` : '';
  }

  function langAttr() {
    return currentLang ? ` lang="${currentLang}"` : '';
  }

  // ── Node renderers ──

  const renderers = {
    'page-header': (n) => { pageHeader = n; return ''; },
    'page-footer': (n) => { pageFooter = n; return ''; },

    'set-variable': (n) => { variables[n.props.name] = n.props.value; return ''; },
    'set-counter': (n) => {
      counters[n.props.name] = { value: n.props.initial, increment: n.props.increment, mode: 'numeric' };
      return '';
    },

    'font-push': (n) => { fontStack.push(n.props.value); return ''; },
    'font-reset': () => { fontStack = []; return ''; },
    'underscore-on': () => { underscoreOn = true; return ''; },
    'underscore-off': () => { underscoreOn = false; return ''; },
    'align': (n) => { currentAlign = n.props.value; return ''; },
    'indent': (n) => {
      if (n.props.value === '0in' || n.props.value === '0') currentIndent = '';
      else currentIndent = n.props.direction;
      return '';
    },
    'vertical-margin': () => '',
    'label': (n) => `<a id="${n.props.name}"></a>\n`,
    'language': (n) => { currentLang = n.props.code; return ''; },

    'text-title': (n) => {
      const id = n.props.label ? ` id="${n.props.label}"` : '';
      return `<h2 class="${pfx}-title"${id}>${escapeHTML(n.text)}</h2>\n`;
    },

    'paragraph': (n) => {
      let text = resolveInline(n.text);
      // Drop cap
      if (pendingDropCap > 0) {
        const first = n.text[0];
        text = `<span class="${pfx}-drop-cap" style="--dc-lines:${pendingDropCap}">${first}</span>` + resolveInline(n.text.slice(1));
        pendingDropCap = 0;
      }
      return `<p class="${pfx}-p${alignClass()}${indentClass()}"${styleAttr()}${langAttr()}>${text}</p>\n`;
    },

    'space': (n) => `<div class="${pfx}-space" style="height:${(n.props.amount || 1) * 1.5}rem"></div>\n`,
    'break-page': () => `<div class="${pfx}-page-break"></div>\n`,

    'horizontal-rule': (n) => {
      const { width, thickness, style } = n.props;
      return `<hr class="${pfx}-hr" style="width:${width};border-top:${thickness} ${style} currentColor">\n`;
    },

    'preformatted': (n) => `<pre class="${pfx}-pre">${escapeHTML(n.text)}</pre>\n`,
    'literal': (n) => `<pre class="${pfx}-literal">${escapeHTML(n.text)}</pre>\n`,
    'keep': (n) => `<div class="${pfx}-keep"><p>${resolveInline(n.text)}</p></div>\n`,
    'footnote': (n) => `<div class="${pfx}-footnote"><sup>*</sup> ${resolveInline(n.text)}</div>\n`,
    'endnote': (n) => `<div class="${pfx}-endnote"><sup>†</sup> ${resolveInline(n.text)}</div>\n`,
    'sidenote': (n) => `<aside class="${pfx}-sidenote">${resolveInline(n.text)}</aside>\n`,

    'drop-cap': (n) => { pendingDropCap = n.props.lines; return ''; },

    'figure': (n) => {
      const id = n.props.label ? ` id="${n.props.label}"` : '';
      let inner = '';
      for (const child of n.children || []) {
        if (child.type === 'insert-graphic') {
          const src = baseUrl ? baseUrl + '/' + child.props.path : child.props.path;
          inner += `<img src="${src}" alt="${escapeHTML(child.props.alt)}" class="${pfx}-graphic">\n`;
        }
        if (child.type === 'caption') {
          inner += `<figcaption class="${pfx}-caption">${resolveInline(child.text)}</figcaption>\n`;
        }
      }
      return `<figure class="${pfx}-figure"${id}>\n${inner}</figure>\n`;
    },

    'insert-graphic': (n) => {
      const src = baseUrl ? baseUrl + '/' + n.props.path : n.props.path;
      return `<img src="${src}" alt="${escapeHTML(n.props.alt)}" class="${pfx}-graphic">\n`;
    },

    'list': (n) => renderList(n),

    'math-block': (n) => {
      const p = n.props;
      let latex;
      if (p.hasFraction) latex = fractionToLatex(p.numerator, p.denominator);
      else if (p.hasMatrix) latex = matrixToLatex(p.matrixRows, p.matrixDelimiters);
      else if (p.hasCases) latex = casesToLatex(p.casesRows);
      else latex = composeToLatex(p.expression);
      const id = p.label ? ` id="${p.label}"` : '';
      return `<div class="${pfx}-math-block"${id}>${renderKatexSafe(latex, true)}</div>\n`;
    },

    'math-align': (n) => {
      const latex = alignToLatex(n.props.lines);
      return `<div class="${pfx}-math-align">${renderKatexSafe(latex, true)}</div>\n`;
    }
  };

  function renderList(node) {
    const lt = node.props.listType;
    if (lt === 'definition') {
      let out = `<dl class="${pfx}-dl">\n`;
      for (const item of node.children || []) {
        if (item.type === 'definition-item') {
          out += `<dt class="${pfx}-dt">${resolveInline(item.props.term)}</dt>\n`;
          out += `<dd class="${pfx}-dd">${resolveInline(item.props.definition)}</dd>\n`;
        }
      }
      out += '</dl>\n';
      return out;
    }

    const tag = lt === 'numbered' ? 'ol' : 'ul';
    let out = `<${tag} class="${pfx}-list ${pfx}-list-${lt}">\n`;
    for (const item of node.children || []) {
      if (item.type === 'list-item') {
        out += `<li>${resolveInline(item.text)}`;
        for (const child of item.children || []) {
          if (child.type === 'list') out += '\n' + renderList(child);
        }
        out += '</li>\n';
      }
    }
    out += `</${tag}>\n`;
    return out;
  }

  // ── Main render loop ──

  let body = '';
  for (const node of nodes) {
    const fn = renderers[node.type];
    if (fn) body += fn(node);
  }

  // Assemble page
  let html = '';
  if (pageHeader) {
    html += `<div class="${pfx}-page-header ${pfx}-align-${pageHeader.props.align}">${resolveInline(pageHeader.text)}</div>\n`;
  }
  html += body;
  if (pageFooter) {
    html += `<div class="${pfx}-page-footer ${pfx}-align-${pageFooter.props.align}">${resolveInline(pageFooter.text)}</div>\n`;
  }

  if (wrapPage) {
    html = `<div class="${pfx}-page">\n${html}</div>\n`;
  }

  return html;
}



function render(source, opts) {
  opts = opts || {};
  var ast = parse(source);
  return renderToHTML(ast, opts);
}

function mount(source, element, opts) {
  element.innerHTML = render(source, opts || {});
}


  return {
    parse: parse,
    renderToHTML: renderToHTML,
    render: render,
    mount: mount,
    composeToLatex: composeToLatex,
    fractionToLatex: fractionToLatex,
    matrixToLatex: matrixToLatex,
    casesToLatex: casesToLatex,
    alignToLatex: alignToLatex
  };
}));
