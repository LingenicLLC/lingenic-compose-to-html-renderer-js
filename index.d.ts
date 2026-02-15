/**
 * Lingenic Compose HTML Renderer
 * TypeScript definitions
 */

export interface RenderOptions {
  /** KaTeX instance for math rendering. Falls back to <code> tags if not provided. */
  katex?: unknown;
  /** Pre-set variables as key-value pairs. */
  variables?: Record<string, string>;
  /** CSS class prefix for all generated elements. Default: 'cr' */
  cssPrefix?: string;
  /** Wrap output in a .cr-page container. Default: true */
  wrapPage?: boolean;
  /** Base URL for resolving image paths. */
  baseUrl?: string;
}

export type ComposeNodeType =
  | 'page-header'
  | 'page-footer'
  | 'text-title'
  | 'paragraph'
  | 'break-page'
  | 'font-push'
  | 'font-reset'
  | 'underscore-on'
  | 'underscore-off'
  | 'align'
  | 'indent'
  | 'vertical-margin'
  | 'list'
  | 'list-item'
  | 'definition-item'
  | 'math-block'
  | 'math-align'
  | 'preformatted'
  | 'literal'
  | 'keep'
  | 'footnote'
  | 'endnote'
  | 'sidenote'
  | 'figure'
  | 'insert-graphic'
  | 'caption'
  | 'set-variable'
  | 'set-counter'
  | 'label'
  | 'horizontal-rule'
  | 'language'
  | 'drop-cap';

export interface ComposeNode {
  type: ComposeNodeType;
  [key: string]: unknown;
}

/**
 * Parse and render Compose source to HTML in one step.
 * @param source - Compose source text
 * @param options - Render options
 * @returns HTML string
 */
export function render(source: string, options?: RenderOptions): string;

/**
 * Parse, render, and inject into a DOM element.
 * @param source - Compose source text
 * @param element - Target DOM element
 * @param options - Render options
 */
export function mount(source: string, element: Element, options?: RenderOptions): void;

/**
 * Parse Compose source into an AST.
 * @param source - Compose source text
 * @returns Array of AST nodes
 */
export function parse(source: string): ComposeNode[];

/**
 * Render a pre-parsed AST to HTML.
 * @param nodes - Array of AST nodes
 * @param options - Render options
 * @returns HTML string
 */
export function renderToHTML(nodes: ComposeNode[], options?: RenderOptions): string;

/**
 * Convert a Compose Unicode math expression to LaTeX.
 * @param expr - Unicode math expression
 * @returns LaTeX string
 */
export function composeToLatex(expr: string): string;
