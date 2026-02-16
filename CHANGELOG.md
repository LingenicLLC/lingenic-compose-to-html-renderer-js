# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-16

### Changed
- Updated to Lingenic Compose 2.0 specification
- Command renames with backward compatibility:
  - `.begin-header`/`.end-header` (was `.begin-page-header`/`.end-page-header`)
  - `.begin-footer`/`.end-footer` (was `.begin-page-footer`/`.end-page-footer`)
  - `.begin-literal`/`.end-literal` (was `.block-begin-literal`/`.block-end-literal`)
  - `.begin-keep`/`.end-keep` (was `.block-begin-keep`/`.block-end-keep`)
  - `.begin-footnote`/`.end-footnote` (was `.block-begin-footnote`/`.block-end-footnote`)
  - `.title "text"` single-line command (was `.begin-text-title`/`.end-text-title`)
- Legacy command names still supported for backward compatibility

## [0.1.0] - 2026-02-15

### Added
- Initial release
- Parse `.compose` source files to AST
- Render AST to semantic HTML
- KaTeX integration for math rendering (optional)
- Unicode math to LaTeX conversion (ISO 80000-2)
- Support for document structure: page headers/footers, titles, page breaks
- Text formatting: bold, italic, underscore, alignment, indentation
- Lists: numbered, bulleted, definition lists with nesting
- Math: block math, inline math, fractions, matrices, aligned equations, cases
- Variables and counters with auto-increment
- Cross-references with labels
- Content blocks: footnotes, endnotes, sidenotes, keep blocks, preformatted, literal
- Figures with graphics and captions
- Additional features: horizontal rules, drop caps, ruby text, language tags, citations
- Default CSS stylesheet
- ESM and UMD distribution bundles
- TypeScript type definitions
