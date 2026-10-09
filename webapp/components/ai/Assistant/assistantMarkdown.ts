/**
 * Renders the model's Markdown to safe HTML. Unlike the shared markdown utils, it loads nothing remote: a survey
 * label could prompt-inject an image URL that carries survey data out of the browser as soon as the answer renders.
 */
import DOMPurify from 'isomorphic-dompurify'
import { Marked } from 'marked'

// formatting tags only: no img, picture, source, video, audio, iframe, object, embed, link, style, svg, form
const ALLOWED_TAGS = [
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]
// no src, srcset, style, poster or data-*
const ALLOWED_ATTR = ['href', 'title', 'start', 'align']
const ALLOWED_URI_REGEXP = /^(?:https?|mailto):/i

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// a Markdown image becomes a link (the user decides whether to open it), never a request
const marked = new Marked({
  renderer: {
    image: ({ href, text }: { href: string; text: string }) =>
      `<a href="${escapeHtml(href)}">${escapeHtml(text || href)}</a>`,
  },
})

const setLinkAttributes = (node: Element) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
}

/**
 * Converts the model's Markdown to sanitized HTML without remote resources.
 * @param {string} source - Markdown text.
 * @returns {string} The HTML: images are links, links open in a new tab with noopener noreferrer.
 */
export const renderAssistantMarkdown = (source: string): string => {
  const html = marked.parse(source, { async: false }) as string
  // the DOMPurify instance is shared: the hook lives only for this call
  DOMPurify.addHook('afterSanitizeAttributes', setLinkAttributes)
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: [...ALLOWED_ATTR, 'target', 'rel'],
      ALLOWED_URI_REGEXP,
      ALLOW_DATA_ATTR: false,
    })
  } finally {
    DOMPurify.removeHook('afterSanitizeAttributes', setLinkAttributes)
  }
}
