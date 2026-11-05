import { xml2js } from 'xml-js'

// node of the xml-js non-compact tree
export type XmlElement = {
  type?: string
  name?: string
  attributes?: Record<string, string | number | undefined>
  elements?: XmlElement[]
  text?: string | number | boolean
  cdata?: string
}

/**
 * Removes the namespace prefix of an element or attribute name.
 * @param {string|undefined} name - The name, e.g. "ows:Identifier".
 * @returns {string} The local name, e.g. "Identifier".
 */
export const localName = (name: string | undefined): string => {
  if (!name) return ''
  const colonIndex = name.lastIndexOf(':')
  return colonIndex >= 0 ? name.slice(colonIndex + 1) : name
}

/**
 * Parses an XML document. xml-js does not expand custom DTD entities (it throws), so entity bombs fail fast.
 * @param {string} xml - The document.
 * @returns {XmlElement|null} The root element, or null when the text is not well-formed XML.
 */
export const parseXmlDocument = (xml: string): XmlElement | null => {
  let document: XmlElement
  try {
    document = xml2js(xml, {
      compact: false,
      ignoreComment: true,
      ignoreDeclaration: true,
      ignoreDoctype: true,
      ignoreInstruction: true,
    }) as XmlElement
  } catch {
    return null
  }
  return document.elements?.find((element) => element.type === 'element') ?? null
}

/**
 * Lists the child elements of an element, optionally only those with a local name.
 * @param {XmlElement|undefined} element - The parent.
 * @param {string} [name] - The local name.
 * @returns {XmlElement[]} The children.
 */
export const childElements = (element: XmlElement | undefined, name?: string): XmlElement[] =>
  (element?.elements ?? []).filter(
    (child) => child.type === 'element' && (name === undefined || localName(child.name) === name)
  )

/**
 * Returns the first child element with a local name.
 * @param {XmlElement|undefined} element - The parent.
 * @param {string} name - The local name.
 * @returns {XmlElement|undefined} The child.
 */
export const firstChild = (element: XmlElement | undefined, name: string): XmlElement | undefined =>
  childElements(element, name)[0]

/**
 * Follows a path level by level, through every matching child (not only the first), so a first branch without the
 * rest of the path does not hide a later one. Iterative; each level holds at most the document's elements.
 * @param {XmlElement|undefined} element - The start element.
 * @param {string[]} names - The local names of the path.
 * @returns {XmlElement[]} The elements at the end of the path, in document order.
 */
export const findAllPath = (element: XmlElement | undefined, names: string[]): XmlElement[] => {
  let level: XmlElement[] = element ? [element] : []
  for (const name of names) {
    level = level.flatMap((parent) => childElements(parent, name))
    if (level.length === 0) return []
  }
  return level
}

/**
 * Follows a path of children and returns the first element at its end.
 * @param {XmlElement|undefined} element - The start element.
 * @param {string[]} names - The local names of the path.
 * @returns {XmlElement|undefined} The first element at the end of the path.
 */
export const findPath = (element: XmlElement | undefined, names: string[]): XmlElement | undefined =>
  findAllPath(element, names)[0]

/**
 * Returns the text content (text and CDATA) of an element.
 * @param {XmlElement|undefined} element - The element.
 * @returns {string} The trimmed text; empty when there is none.
 */
export const textOf = (element: XmlElement | undefined): string => {
  let text = ''
  for (const child of element?.elements ?? []) {
    if (child.type === 'text') text += String(child.text ?? '')
    else if (child.type === 'cdata') text += child.cdata ?? ''
  }
  return text.trim()
}

/**
 * Returns the text of the first child element with a local name.
 * @param {XmlElement|undefined} element - The parent.
 * @param {string} name - The local name.
 * @returns {string} The trimmed text; empty when there is none.
 */
export const childText = (element: XmlElement | undefined, name: string): string => textOf(firstChild(element, name))

/**
 * Returns an attribute by local name ("href" matches "xlink:href").
 * @param {XmlElement|undefined} element - The element.
 * @param {string} name - The local name.
 * @returns {string|undefined} The value.
 */
export const attributeOf = (element: XmlElement | undefined, name: string): string | undefined => {
  for (const [key, value] of Object.entries(element?.attributes ?? {})) {
    if (localName(key) === name && value !== undefined) return String(value)
  }
  return undefined
}
