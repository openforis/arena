import type { NodeDefType } from '@openforis/arena-core'
import type { Element } from 'xml-js'

import * as A from '@core/arena'

import { nodeDefType } from '@core/survey/nodeDef'
import NodeDefUniqueNameGenerator from './nodeDefUniqueNameGenerator'

// node definition of a Collect survey (survey IDML parsed by xml-js in non compact mode)
export type CollectNodeDef = Element

// element of the Collect survey XML (parsed by xml-js in non compact mode)
export type CollectElement = Element

const keys = {
  attributes: 'attributes',
  elements: 'elements',
  name: 'name',
  type: 'type',
  lang: 'xml:lang',
  text: 'text',
}

const collectNodeDefTypes = {
  boolean: 'boolean',
  code: 'code',
  coordinate: 'coordinate',
  date: 'date',
  entity: 'entity',
  file: 'file',
  number: 'number',
  range: 'range',
  taxon: 'taxon',
  text: 'text',
  time: 'time',
}

// type (and field, for range attributes split into 2 node defs) of the node defs created for a Collect node def
type CollectNodeDefField = { type: NodeDefType; field?: string }

const nodeDefFieldsExtractorByCollectType: Record<string, (collectNodeDef: CollectNodeDef) => CollectNodeDefField[]> = {
  [collectNodeDefTypes.boolean]: () => [{ type: nodeDefType.boolean }],
  [collectNodeDefTypes.code]: () => [{ type: nodeDefType.code }],
  [collectNodeDefTypes.coordinate]: () => [{ type: nodeDefType.coordinate }],
  [collectNodeDefTypes.date]: () => [{ type: nodeDefType.date }],
  [collectNodeDefTypes.entity]: () => [{ type: nodeDefType.entity }],
  [collectNodeDefTypes.file]: () => [{ type: nodeDefType.file }],
  [collectNodeDefTypes.number]: (collectNodeDef) => {
    const type = getAttribute('type')(collectNodeDef) === 'real' ? nodeDefType.decimal : nodeDefType.integer
    return [{ type }]
  },
  [collectNodeDefTypes.range]: (collectNodeDef) => {
    const type = getAttribute('type')(collectNodeDef) === 'real' ? nodeDefType.decimal : nodeDefType.integer
    return [
      { type, field: 'from' },
      { type, field: 'to' },
    ]
  },
  [collectNodeDefTypes.taxon]: () => [{ type: nodeDefType.taxon }],
  [collectNodeDefTypes.text]: () => [{ type: nodeDefType.text }],
  [collectNodeDefTypes.time]: () => [{ type: nodeDefType.time }],
}

export const layoutTypes = {
  table: 'table',
}

export const samplingPointDataCodeListNames = ['sampling_design', 'ofc_sampling_design']

export const getNodeDefFieldsByCollectNodeDef = (collectNodeDef: CollectNodeDef) => {
  const collectType = getElementName(collectNodeDef)
  const fieldsExtractor = nodeDefFieldsExtractorByCollectType[collectType]
  return fieldsExtractor?.(collectNodeDef)
}

export const toLabels =
  (elName, defaultLang, typesFilter = [], suffix = '') =>
  (xml) =>
    A.pipe(
      getElementsByName(elName),
      A.reduce((labelsAcc, labelEl) => {
        const lang = getAttribute(keys.lang, defaultLang)(labelEl)
        const type = getAttribute(keys.type)(labelEl)

        if (!A.has(lang, labelsAcc) && (A.isEmpty(typesFilter) || A.includes(type, typesFilter))) {
          const text = getText(labelEl) + suffix
          return A.assoc(lang, text, labelsAcc)
        }

        return labelsAcc
      }, {})
    )(xml)

export const getElements = A.propOr([], keys.elements)

export const getElementsByName = (name: string) =>
  A.pipe(
    getElements,
    A.filter((el) => getElementName(el) === name)
  )

export const getElementsByPath = (path: string[]) => (xml) =>
  A.reduce(
    (acc, pathPart) =>
      A.ifElse(
        A.isNil,
        A.identity,
        A.pipe(A.ifElse(A.is(Array), A.head, A.identity), getElementsByName(pathPart))
      )(acc),
    xml,
    path
  )

export const getElementByName = (name: string) => A.pipe(getElementsByName(name), A.head)

export const getNodeDefChildByName = (name: string) =>
  A.pipe(
    getElements,
    A.find((el) => getNodeDefName(el) === name)
  )

export const getElementName = A.prop(keys.name)

export const getText = A.pipe(getElements, A.find(A.propEq(keys.type, keys.text)), A.prop(keys.text))

export const getChildElementText = (name: string) => A.pipe(getElementByName(name), getText)

export const getAttributes = A.propOr({}, keys.attributes)

export const getAttribute = (name: string, defaultValue = null) => A.pipe(getAttributes, A.propOr(defaultValue, name))

/**
 * Returns the attribute called 'name' of a node def element.
 */
const getNodeDefName = getAttribute('name')

export const getAttributeName = getNodeDefName

export const getAttributeBoolean = (name: string) => A.pipe(getAttribute(name), A.equals('true'))

const _transformValue = (value: unknown) =>
  value === 'true' || value === 'false'
    ? value === 'true' // cast value into boolean
    : value

export const getUiAttribute =
  (name, defaultValue = null) =>
  (collectXmlElement) => {
    const value =
      getAttribute(`n1:${name}`)(collectXmlElement) || getAttribute(`ui:${name}`, defaultValue)(collectXmlElement)
    return _transformValue(value)
  }

export const getCollectAttribute =
  (name, defaultValue = null) =>
  (collectXmlElement) => {
    const value =
      getAttribute(`collect:${name}`)(collectXmlElement) ?? getAttribute(`n0:${name}`, defaultValue)(collectXmlElement)
    return _transformValue(value)
  }

export const getNodeDefRoot = A.pipe(getElementsByPath(['schema', 'entity']), A.head)

export const getNodeDefByPath = (collectNodeDefPath: string) => (collectSurvey) => {
  const collectAncestorNodeNames = A.pipe(A.split('/'), A.reject(A.isEmpty))(collectNodeDefPath)

  let currentCollectNode = getElementByName('schema')(collectSurvey)

  for (const collectAncestorNodeName of collectAncestorNodeNames) {
    const collectChildNodeDef = A.pipe(
      A.propOr([], 'elements'),
      A.find(A.pathEq(['attributes', 'name'], collectAncestorNodeName))
    )(currentCollectNode)

    if (collectChildNodeDef) {
      currentCollectNode = collectChildNodeDef
    } else {
      return null // Node def not found
    }
  }

  return currentCollectNode
}

export const getNodeDefChildren = (collectNodeDef: CollectNodeDef) =>
  A.pipe(getElements, A.filter(_isNodeDefElement))(collectNodeDef)

const _isNodeDefElement = A.pipe(getElementName, (name) => A.includes(name, A.keys(collectNodeDefTypes)))

export const isCollectEarthSurvey = (collectSurvey: CollectNodeDef) =>
  getAttribute('collect:target', null)(collectSurvey) === 'CE'

export const getUri = (collectSurvey: CollectNodeDef) => getChildElementText('uri')(collectSurvey)

export const visitNodeDefs = ({
  collectSurvey,
  visitor,
}: {
  collectSurvey: CollectNodeDef
  visitor: (params: {
    def: CollectNodeDef
    name: string
    path: string
    parentPath: string
    field: string | null
  }) => void
}) => {
  const stack = []
  const rootDef = getNodeDefRoot(collectSurvey)
  stack.push({ def: rootDef, parentPath: '' })

  while (stack.length > 0) {
    const { def, parentPath } = stack.pop()

    const collectNodeDefDefFields = getNodeDefFieldsByCollectNodeDef(def)
    if (collectNodeDefDefFields) {
      const name = getAttribute('name')(def)
      const path = `${parentPath}/${name}`

      collectNodeDefDefFields.forEach((collectNodeDefField) => {
        const { type, field = null } = collectNodeDefField

        visitor({ def, name, path, parentPath, field })

        if (type === nodeDefType.entity) {
          def.elements.forEach((collectNodeDefChild) => {
            stack.push({ def: collectNodeDefChild, parentPath: path })
          })
        }
      })
    }
  }
}

export const generateArenaNodeDefNamesByPath = (collectSurvey: CollectNodeDef) => {
  const namesByPath = {}
  const nodeDefUniqueNameGenerator = new NodeDefUniqueNameGenerator()

  visitNodeDefs({
    collectSurvey,
    visitor: ({ name, path, parentPath, field }) => {
      const nodeDefNameSuffix = field ? `_${field}` : ''

      const parentName = namesByPath[parentPath]

      const nodeDefName = nodeDefUniqueNameGenerator.getUniqueNodeDefName({
        parentNodeDefName: parentName,
        nodeDefName: name + nodeDefNameSuffix,
      })

      namesByPath[path] = nodeDefName
    },
  })

  return namesByPath
}
