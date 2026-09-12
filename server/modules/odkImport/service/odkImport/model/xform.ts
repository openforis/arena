import { languageCodes } from '@core/app/languages'

import * as FileXml from '@server/utils/file/fileXml'

/**
 * A node in the verbose (non-compact) xml-js tree produced by FileXml.parseToJson(xml, false):
 * { type: 'element', name: 'tag', attributes: {...}, elements: [...] } or { type: 'text', text: '...' }.
 */
export interface XmlElement {
  type?: string
  name?: string
  attributes?: Record<string, string>
  elements?: XmlElement[]
  text?: string
}

export interface XFormBind {
  nodeset: string
  type: string | null
  relevant: string | null
  constraint: string | null
  required: string | null
  calculate: string | null
  readonly: string | null
}

export interface XFormBodyItem {
  value: string
  labelRef: string | null
  labelText: string | null
}

export interface XFormBodyControl {
  path: string
  controlType: string
  appearance: string | null
  mediatype: string | null
  labelRef: string | null
  labelText: string | null
  items: XFormBodyItem[]
  itemsetInstanceId: string | null
  hasChoiceFilter: boolean
}

export interface XFormSecondaryInstanceItem {
  name: string
  labelRef: string | null
  labelText: string | null
}

export interface InstanceNodeVisit {
  element: XmlElement
  name: string
  path: string
  parentPath: string | null
}

export type ItextTranslations = Record<string, Record<string, string>>

// XForm elements are namespace-prefixed inconsistently across producers (h:body, xf:body, body...);
// comparing local names only (ignoring the prefix) is more robust than hardcoding a prefix.
export const xmlLocalName = (name: string | undefined): string => (name ? (name.split(':').pop() ?? name) : '')
const localName = xmlLocalName

const isElement = (el: XmlElement): boolean => el.type === 'element'

// Exported so callers walking the primary-instance tree themselves (e.g. NodeDefsImportJob's
// recursive, DB-insert-interleaved walk, which can't use visitPrimaryInstanceNodes's synchronous
// visitor callback) can reuse the same element-filtering logic instead of duplicating it.
export const getChildElements = (el: XmlElement): XmlElement[] => (el.elements ?? []).filter(isElement)

const getDirectChildrenByLocalName = (el: XmlElement, name: string): XmlElement[] =>
  getChildElements(el).filter((child) => localName(child.name) === name)

const getDirectChildByLocalName = (el: XmlElement, name: string): XmlElement | null =>
  getDirectChildrenByLocalName(el, name)[0] ?? null

const findAllByLocalName = (el: XmlElement, name: string): XmlElement[] => {
  const result: XmlElement[] = []
  const visit = (node: XmlElement) => {
    if (isElement(node) && localName(node.name) === name) result.push(node)
    getChildElements(node).forEach(visit)
  }
  visit(el)
  return result
}

const findFirstByLocalName = (el: XmlElement, name: string): XmlElement | null =>
  findAllByLocalName(el, name)[0] ?? null

export const getAttribute =
  (name: string, defaultValue: string | null = null) =>
  (el: XmlElement | null): string | null =>
    el?.attributes?.[name] ?? defaultValue

// Exported for reuse by data import (odkAttributeValueExtractor's caller), which reads a submission
// leaf element's own text content the same way schema import reads a <label>'s.
export const getElementText = (el: XmlElement | null): string | null => {
  if (!el) return null
  const textNode = (el.elements ?? []).find((child) => child.type === 'text')
  return textNode?.text ?? null
}

export const parseXForm = (xml: string): XmlElement => {
  const parsed = FileXml.parseToJson(xml, false) as XmlElement
  const root = getChildElements(parsed)[0]
  if (!root) throw new Error('Invalid XForm: no root element found')
  return root
}

export const getFormTitle = (xform: XmlElement): string | null => getElementText(findFirstByLocalName(xform, 'title'))

const getModel = (xform: XmlElement): XmlElement => {
  const modelEl = findFirstByLocalName(xform, 'model')
  if (!modelEl) throw new Error('Invalid XForm: no <model> element found')
  return modelEl
}

/**
 * Locates the primary instance's data root element (the element that defines the node shape of the form,
 * e.g. the <data id="..."> under <model><instance> with no `id` attribute of its own).
 */
export const getPrimaryInstanceRoot = (xform: XmlElement): XmlElement => {
  const modelEl = getModel(xform)
  const instanceEls = getDirectChildrenByLocalName(modelEl, 'instance')
  const primaryInstanceEl = instanceEls.find((instanceEl) => !getAttribute('id')(instanceEl)) ?? instanceEls[0]
  if (!primaryInstanceEl) throw new Error('Invalid XForm: no primary <instance> element found')
  const dataRootEl = getChildElements(primaryInstanceEl)[0]
  if (!dataRootEl) throw new Error('Invalid XForm: primary instance has no data root element')
  return dataRootEl
}

/**
 * Depth-first walk of the primary instance tree (node shape only - not repeat cardinality, see
 * buildRepeatPathsSet). The root itself is visited (becomes Arena's root entity, mirroring how
 * Collect's importer treats its schema root). The reserved ODK/OpenRosa `meta` node (instanceID etc.,
 * conventionally a direct child of the root) is skipped entirely, along with its descendants.
 */
export const visitPrimaryInstanceNodes = (
  primaryInstanceRoot: XmlElement,
  visitor: (node: InstanceNodeVisit) => void
): void => {
  const rootName = localName(primaryInstanceRoot.name)
  const visit = (element: XmlElement, path: string, parentPath: string | null) => {
    if (localName(element.name) === 'meta') return
    visitor({ element, name: localName(element.name), path, parentPath })
    getChildElements(element).forEach((child) => visit(child, `${path}/${localName(child.name)}`, path))
  }
  visit(primaryInstanceRoot, `/${rootName}`, null)
}

export const buildBindsByPath = (xform: XmlElement): Map<string, XFormBind> => {
  const modelEl = getModel(xform)
  const bindsByPath = new Map<string, XFormBind>()
  getDirectChildrenByLocalName(modelEl, 'bind').forEach((bindEl) => {
    const nodeset = getAttribute('nodeset')(bindEl)
    if (!nodeset) return
    bindsByPath.set(nodeset, {
      nodeset,
      type: getAttribute('type')(bindEl),
      relevant: getAttribute('relevant')(bindEl),
      constraint: getAttribute('constraint')(bindEl),
      required: getAttribute('required')(bindEl),
      calculate: getAttribute('calculate')(bindEl),
      readonly: getAttribute('readonly')(bindEl),
    })
  })
  return bindsByPath
}

/**
 * Absolute nodeset paths that are wrapped in a body <repeat> - the only reliable signal in an XForm
 * that a primary-instance node is repeatable (Arena `multiple: true`). A <group> at the same path with
 * no wrapping <repeat> is a single, non-repeatable entity.
 */
export const buildRepeatPathsSet = (xform: XmlElement): Set<string> => {
  const bodyEl = findFirstByLocalName(xform, 'body')
  const repeatPaths = new Set<string>()
  if (!bodyEl) return repeatPaths
  findAllByLocalName(bodyEl, 'repeat').forEach((repeatEl) => {
    const nodeset = getAttribute('nodeset')(repeatEl)
    if (nodeset) repeatPaths.add(nodeset)
  })
  return repeatPaths
}

const ITEXT_REF_PATTERN = /^jr:itext\(['"](.+)['"]\)$/
const ITEMSET_INSTANCE_PATTERN = /instance\(['"]([^'"]+)['"]\)/

const extractLabel = (containerEl: XmlElement): { labelRef: string | null; labelText: string | null } => {
  const labelEl = getDirectChildByLocalName(containerEl, 'label')
  if (!labelEl) return { labelRef: null, labelText: null }
  const ref = getAttribute('ref')(labelEl)
  if (ref) {
    const match = ITEXT_REF_PATTERN.exec(ref.trim())
    if (match) return { labelRef: match[1], labelText: null }
  }
  return { labelRef: null, labelText: getElementText(labelEl) }
}

const extractBodyItems = (controlEl: XmlElement): XFormBodyItem[] =>
  getDirectChildrenByLocalName(controlEl, 'item').map((itemEl) => {
    const valueEl = getDirectChildByLocalName(itemEl, 'value')
    const { labelRef, labelText } = extractLabel(itemEl)
    return { value: getElementText(valueEl) ?? '', labelRef, labelText }
  })

const extractItemsetInstanceId = (controlEl: XmlElement): string | null => {
  const itemsetEl = getDirectChildByLocalName(controlEl, 'itemset')
  if (!itemsetEl) return null
  const reference = getAttribute('nodeset')(itemsetEl) ?? getElementText(itemsetEl)
  if (!reference) return null
  const match = ITEMSET_INSTANCE_PATTERN.exec(reference)
  return match ? match[1] : null
}

// pyxform/ODK Central compile a choice_filter into an XPath predicate appended to the itemset's
// nodeset reference (e.g. "instance('list')/root/item[parent_field=/data/other_field]") - a "[" there
// is the reliable signal, since a plain (unfiltered) itemset reference never contains one.
const extractHasChoiceFilter = (controlEl: XmlElement): boolean => {
  const itemsetEl = getDirectChildByLocalName(controlEl, 'itemset')
  if (!itemsetEl) return false
  const reference = getAttribute('nodeset')(itemsetEl) ?? getElementText(itemsetEl)
  return Boolean(reference?.includes('['))
}

const bodyControlLocalNames = ['input', 'select1', 'select', 'upload', 'trigger', 'group', 'repeat']

/**
 * Path-keyed body-element metadata (display info, and the parts a bind alone can't tell us: upload
 * mediatype disambiguates image/audio/video, and select1/select carries the actual choice items).
 */
export const buildBodyControlsByPath = (xform: XmlElement): Map<string, XFormBodyControl> => {
  const bodyEl = findFirstByLocalName(xform, 'body')
  const controlsByPath = new Map<string, XFormBodyControl>()
  if (!bodyEl) return controlsByPath

  bodyControlLocalNames.forEach((controlType) => {
    findAllByLocalName(bodyEl, controlType).forEach((controlEl) => {
      const path =
        getAttribute('ref')(controlEl) ?? getAttribute('nodeset')(controlEl) ?? getAttribute('bind')(controlEl)
      if (!path || controlsByPath.has(path)) return
      const { labelRef, labelText } = extractLabel(controlEl)
      controlsByPath.set(path, {
        path,
        controlType,
        appearance: getAttribute('appearance')(controlEl),
        mediatype: getAttribute('mediatype')(controlEl),
        labelRef,
        labelText,
        items: extractBodyItems(controlEl),
        itemsetInstanceId: extractItemsetInstanceId(controlEl),
        hasChoiceFilter: extractHasChoiceFilter(controlEl),
      })
    })
  })
  return controlsByPath
}

/**
 * Secondary <instance id="..."> choice lists (the itemset(instance('id')/root/item) idiom that
 * pyxform/ODK Central compile external/searchable select lists to), keyed by instance id.
 */
export const getSecondaryInstancesByInstanceId = (xform: XmlElement): Map<string, XFormSecondaryInstanceItem[]> => {
  const modelEl = getModel(xform)
  const result = new Map<string, XFormSecondaryInstanceItem[]>()
  getDirectChildrenByLocalName(modelEl, 'instance').forEach((instanceEl) => {
    const id = getAttribute('id')(instanceEl)
    if (!id) return // the primary instance has no id
    const rootEl = getChildElements(instanceEl)[0]
    if (!rootEl) return
    const items = getDirectChildrenByLocalName(rootEl, 'item').map((itemEl) => {
      const nameEl = getDirectChildByLocalName(itemEl, 'name')
      const { labelRef, labelText } = extractLabel(itemEl)
      return { name: getElementText(nameEl) ?? '', labelRef, labelText }
    })
    if (items.length > 0) result.set(id, items)
  })
  return result
}

const LANG_CODE_SUFFIX_PATTERN = /\(([a-zA-Z-]+)\)\s*$/

// ODK's official XLSForm convention for a language column is "Language Name (code)" (e.g.
// "label::English (en)"), and pyxform/ODK Central preserve that whole string verbatim as the itext
// <translation lang="..."> attribute - not a bare ISO code (confirmed against real pyxform output,
// e.g. a reported `lang="Portuguese (pt)"`). Arena's own language model expects a real ISO 639-1 code
// (core/app/languages.ts), so this extracts the parenthesized code when present and recognized,
// falling back to the raw attribute value unchanged otherwise (already a bare code, or some other
// convention) rather than guessing at a transformation with no evidence behind it.
const normalizeLangCode = (rawLang: string): string => {
  const match = LANG_CODE_SUFFIX_PATTERN.exec(rawLang)
  const code = match?.[1]?.toLowerCase()
  return code && languageCodes.includes(code) ? code : rawLang
}

/**
 * Parses <itext><translation lang="..." default="true()"><text id="..."><value>...</value></text>...
 * into { [textId]: { [lang]: text } }, plus the resolved default language (explicit `default="true()"`
 * wins; otherwise the first translation encountered). The `lang` attribute is normalized to a bare ISO
 * code when it follows ODK's "Name (code)" convention - see normalizeLangCode.
 */
export const getItextTranslations = (
  xform: XmlElement
): { translations: ItextTranslations; defaultLang: string | null } => {
  const itextEl = findFirstByLocalName(xform, 'itext')
  const translations: ItextTranslations = {}
  let defaultLang: string | null = null
  if (!itextEl) return { translations, defaultLang }

  getDirectChildrenByLocalName(itextEl, 'translation').forEach((translationEl) => {
    const rawLang = getAttribute('lang')(translationEl)
    if (!rawLang) return
    const lang = normalizeLangCode(rawLang)
    const isDefault = ['true()', 'true'].includes(getAttribute('default')(translationEl) ?? '')
    if (isDefault || !defaultLang) {
      defaultLang = lang
    }

    getDirectChildrenByLocalName(translationEl, 'text').forEach((textEl) => {
      const textId = getAttribute('id')(textEl)
      if (!textId) return
      // A single <text> can carry several <value> forms (plain label, plus e.g. form="image"/"audio"/
      // "guidance" media annotations for the same question) - prefer the one with no `form` attribute
      // (the plain-text label), falling back to the first value present if every one is annotated.
      const valueEls = getDirectChildrenByLocalName(textEl, 'value')
      const valueEl = valueEls.find((el) => !getAttribute('form')(el)) ?? valueEls[0] ?? null
      const text = getElementText(valueEl)
      if (text === null) return
      if (!translations[textId]) translations[textId] = {}
      translations[textId][lang] = text
    })
  })
  return { translations, defaultLang }
}

/**
 * Resolves a body control/item's label into Arena's { [lang]: text } shape: itext indirection first
 * (multi-language), falling back to a literal <label>text</label> assigned to the form's default
 * language (simple, non-translated forms have no itext block at all).
 */
export const resolveLabels = ({
  labelRef,
  labelText,
  translations,
  defaultLanguage,
}: {
  labelRef: string | null
  labelText: string | null
  translations: ItextTranslations
  defaultLanguage: string
}): Record<string, string> => {
  if (labelRef) return translations[labelRef] ?? {}
  if (labelText !== null && labelText.trim() !== '') return { [defaultLanguage]: labelText }
  return {}
}
