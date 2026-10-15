/**
 * Renders the model's Markdown to safe HTML. Unlike the shared markdown utils, it loads nothing remote: a survey
 * label could prompt-inject an image URL that carries survey data out of the browser as soon as the answer renders.
 * Links can't hide their destination either: a link to another site shows its host and the start of its path, and loses its query string.
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

export type AssistantLinkPolicy = {
  /** Origins whose links are kept as they are (the Arena instance). */
  trustedOrigins?: string[]
  /** Pages whose links are kept as they are, with their sub-paths (the manual): not the whole host. */
  trustedPages?: string[]
}

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const isSamePageOrChild = (url: URL, page: URL): boolean =>
  url.origin === page.origin && (url.pathname === page.pathname || url.pathname.startsWith(`${page.pathname}/`))

const isTrustedLink = (url: URL, { trustedOrigins = [], trustedPages = [] }: AssistantLinkPolicy): boolean =>
  trustedOrigins.includes(url.origin) ||
  trustedPages.some((page) => {
    const pageUrl = parseUrl(page)
    return pageUrl !== null && isSamePageOrChild(url, pageUrl)
  })

// the address of a mailto link; a malformed percent sequence (model output) keeps the raw text instead of throwing
const getMailAddress = (url: URL): string => {
  try {
    return decodeURIComponent(url.pathname)
  } catch {
    return url.pathname
  }
}

const MAX_SHOWN_PATH_SEGMENTS = 2
const MAX_SHOWN_SEGMENT_CHARS = 24

// the first segments of the path, cut short, so data hidden in the path of a link is visible before clicking
const getTrimmedPath = (url: URL): string => {
  const segments = url.pathname.split('/').filter(Boolean)
  const shown = segments
    .slice(0, MAX_SHOWN_PATH_SEGMENTS)
    .map((segment) =>
      segment.length > MAX_SHOWN_SEGMENT_CHARS ? `${segment.slice(0, MAX_SHOWN_SEGMENT_CHARS)}…` : segment
    )
  if (segments.length > MAX_SHOWN_PATH_SEGMENTS) shown.push('…')
  return shown.map((segment) => `/${segment}`).join('')
}

// the part of the link a person checks before clicking: the host and the start of the path, or the mailto address
const getDestination = (url: URL): string =>
  url.protocol === 'mailto:' ? getMailAddress(url) : `${url.host}${getTrimmedPath(url)}`

const URL_TEXT = /^(?:https?:\/\/|mailto:)/i

// the label can't hide where the link goes: a label that is a URL shows the real one, any other shows the host
const showDestination = (node: Element, url: URL) => {
  const text = node.textContent?.trim() ?? ''
  const destination = getDestination(url)
  if (URL_TEXT.test(text)) node.textContent = url.protocol === 'mailto:' ? destination : url.href
  else if (text.toLowerCase() !== destination.toLowerCase()) node.append(` (${destination})`)
}

// data can leave in the query string, the fragment or the user info of a link to another site
const restrictLink = (node: Element, url: URL) => {
  const restricted = new URL(url.href)
  restricted.search = ''
  restricted.hash = ''
  restricted.username = ''
  restricted.password = ''
  node.setAttribute('href', restricted.href)
  node.setAttribute('title', restricted.href)
  showDestination(node, restricted)
}

const createLinkHook =
  (policy: AssistantLinkPolicy) =>
  (node: Element): void => {
    if (node.tagName !== 'A') return
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
    const href = node.getAttribute('href')
    if (href === null) return
    const url = parseUrl(href)
    if (!url) node.removeAttribute('href')
    else if (!isTrustedLink(url, policy)) restrictLink(node, url)
  }

/**
 * Converts the model's Markdown to sanitized HTML without remote resources.
 * @param {string} source - Markdown text.
 * @param {AssistantLinkPolicy} [policy] - The links that are kept as they are; the others lose their query string.
 * @returns {string} The HTML: images are links, links open in a new tab with noopener noreferrer and show where they go.
 */
export const renderAssistantMarkdown = (source: string, policy: AssistantLinkPolicy = {}): string => {
  const html = marked.parse(source, { async: false }) as string
  const linkHook = createLinkHook(policy)
  // the DOMPurify instance is shared: the hook lives only for this call
  DOMPurify.addHook('afterSanitizeAttributes', linkHook)
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: [...ALLOWED_ATTR, 'target', 'rel'],
      ALLOWED_URI_REGEXP,
      ALLOW_DATA_ATTR: false,
    })
  } finally {
    DOMPurify.removeHook('afterSanitizeAttributes', linkHook)
  }
}
