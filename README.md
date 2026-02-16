# ｢‍｣ Lingenic Compose HTML Renderer

｢‍｣ Lingenic Compose 2.0 → HTML renderer with KaTeX math support.

Parses `.compose` source files and renders them to semantic HTML. Math expressions (Unicode per ISO 80000-2) are converted to LaTeX and rendered via KaTeX.

## Install

```bash
npm install lingenic-compose-html-renderer
```

KaTeX is an optional peer dependency — needed only for math rendering:

```bash
npm install katex
```

## Quick Start

### ESM (Node / bundlers)

```js
import { render } from 'lingenic-compose-html-renderer';
import katex from 'katex';

const source = `
.* ｢‍｣ Lingenic Compose 2.0

.title "Hello, Compose"

The area of a circle is %math: 𝐴 = π𝑟² %.
`;

const html = render(source, { katex });
document.getElementById('root').innerHTML = html;
```

### Browser (UMD)

```html
<link rel="stylesheet" href="katex.min.css">
<link rel="stylesheet" href="lingenic-compose-html-renderer.css">
<script src="katex.min.js"></script>
<script src="lingenic-compose-html-renderer.umd.js"></script>

<div id="output"></div>

<script>
  ComposeRenderer.mount(source, document.getElementById('output'), {
    katex: window.katex
  });
</script>
```

## API

### `render(source, options?): string`

One-shot parse + render. Returns an HTML string.

### `mount(source, element, options?): void`

Parse, render, and inject into a DOM element.

### `parse(source): ComposeNode[]`

Parse `.compose` source into an AST. Useful for inspection, transformation, or custom renderers.

### `renderToHTML(nodes, options?): string`

Render a pre-parsed AST to HTML.

### `composeToLatex(expr): string`

Convert a single Compose Unicode math expression to a LaTeX string.

### Options

| Option       | Type     | Default | Description                                  |
|--------------|----------|---------|----------------------------------------------|
| `katex`      | Object   | `null`  | KaTeX instance. Falls back to `<code>` tags. |
| `variables`  | Object   | `{}`    | Pre-set variables `{ name: value }`.         |
| `cssPrefix`  | string   | `'cr'`  | CSS class prefix for all generated elements. |
| `wrapPage`   | boolean  | `true`  | Wrap output in a `.cr-page` container.       |
| `baseUrl`    | string   | `''`    | Base URL for resolving image paths.          |

## Supported Features

### Document Structure
Page headers/footers, text titles with labels, page breaks, vertical margins, spacing.

### Text Formatting
Bold, italic, underscore, alignment (left / center / right / justify), indentation.

### Lists
Numbered, bulleted, definition lists. Nesting supported.

### Mathematics
Block math, inline math (typeset and evaluated), aligned equations, fractions, matrices (with delimiter options), piecewise cases. All Unicode math symbols converted per the [official mapping](https://write-this-in-compose.lingenic.ai/math-to-katex.compose).

### Variables & Counters
`set-variable`, `set-counter` with auto-increment and display modes (numeric, roman, alpha).

### Cross-References
Labels on any block, `%ref: name%` links with page/number/title variants.

### Blocks
Keep blocks, literal blocks, preformatted (fill-off), footnotes, endnotes, sidenotes.

### Figures
`begin-figure` with `insert-graphic`, captions, and labels.

### Other
Horizontal rules (width / thickness / style), drop caps, ruby text, language tags, citations (simplified).

## Styling

Import the default stylesheet:

```js
import 'lingenic-compose-html-renderer/style.css';
```

Or in HTML:

```html
<link rel="stylesheet" href="lingenic-compose-html-renderer.css">
```

All classes use the `cr-` prefix. Override any rule to match your design system.

## Math Without KaTeX

If KaTeX is not provided, math expressions render as `<code>` blocks containing the LaTeX string. You can use the `composeToLatex()` export to integrate with any other math renderer (MathJax, Temml, etc.).

## Specification

- AI reference: https://write-this-in-compose.lingenic.ai
- Full specification: https://compose.lingenic.com/specification/
- Math specification: https://compose.lingenic.com/math/
- Math-to-KaTeX mapping: https://write-this-in-compose.lingenic.ai/math-to-katex.compose

## License

Apache 2.0
