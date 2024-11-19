import * as R from 'ramda'

import { nodeDefType } from '@core/survey/nodeDef'
import NodeDefUniqueNameGenerator from './nodeDefUniqueNameGenerator'

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

const nodeDefFieldsExtractorByCollectType = {
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

export const getNodeDefFieldsByCollectNodeDef = (collectNodeDef) => {
  const collectType = getElementName(collectNodeDef)
  const fieldsExtractor = nodeDefFieldsExtractorByCollectType[collectType]
  return fieldsExtractor && fieldsExtractor(collectNodeDef)
}

export const toLabels =
  (elName, defaultLang, typesFilter = [], suffix = '') =>
  (xml) =>
    R.pipe(
      getElementsByName(elName),
      R.reduce((labelsAcc, labelEl) => {
        const lang = getAttribute(keys.lang, defaultLang)(labelEl)
        const type = getAttribute(keys.type)(labelEl)

        if (!R.has(lang, labelsAcc) && (R.isEmpty(typesFilter) || R.includes(type, typesFilter))) {
          const text = getText(labelEl) + suffix
          return R.assoc(lang, text, labelsAcc)
        }

        return labelsAcc
      }, {})
    )(xml)

export const getElements = R.propOr([], keys.elements)

export const getElementsByName = (name) =>
  R.pipe(
    getElements,
    R.filter((el) => getElementName(el) === name)
  )

export const getElementsByPath = (path) => (xml) =>
  R.reduce(
    (acc, pathPart) =>
      R.ifElse(
        R.isNil,
        R.identity,
        R.pipe(R.ifElse(R.is(Array), R.head, R.identity), getElementsByName(pathPart))
      )(acc),
    xml,
    path
  )

export const getElementByName = (name) => R.pipe(getElementsByName(name), R.head)

export const getNodeDefChildByName = (name) =>
  R.pipe(
    getElements,
    R.find((el) => getNodeDefName(el) === name)
  )

export const getElementName = R.prop(keys.name)

export const getText = R.pipe(getElements, R.find(R.propEq(keys.type, keys.text)), R.prop(keys.text))

export const getChildElementText = (name) => R.pipe(getElementByName(name), getText)

export const getAttributes = R.propOr({}, keys.attributes)

export const getAttribute = (name, defaultValue = null) => R.pipe(getAttributes, R.propOr(defaultValue, name))

/**
 * Returns the attribute called 'name' of a node def element.
 */
const getNodeDefName = getAttribute('name')

export const getAttributeName = getNodeDefName

export const getAttributeBoolean = (name) => R.pipe(getAttribute(name), R.equals('true'))

const _transformValue = (value) =>
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

export const getNodeDefRoot = R.pipe(getElementsByPath(['schema', 'entity']), R.head)

export const getNodeDefByPath = (collectNodeDefPath) => (collectSurvey) => {
  const collectAncestorNodeNames = R.pipe(R.split('/'), R.reject(R.isEmpty))(collectNodeDefPath)

  let currentCollectNode = getElementByName('schema')(collectSurvey)

  for (const collectAncestorNodeName of collectAncestorNodeNames) {
    const collectChildNodeDef = R.pipe(
      R.propOr([], 'elements'),
      R.find(R.pathEq(['attributes', 'name'], collectAncestorNodeName))
    )(currentCollectNode)

    if (collectChildNodeDef) {
      currentCollectNode = collectChildNodeDef
    } else {
      return null // Node def not found
    }
  }

  return currentCollectNode
}

export const getNodeDefChildren = (collectNodeDef) => R.pipe(getElements, R.filter(_isNodeDefElement))(collectNodeDef)

const _isNodeDefElement = R.pipe(getElementName, (name) => R.includes(name, R.keys(collectNodeDefTypes)))

export const isCollectEarthSurvey = (collectSurvey) => getAttribute('collect:target', null)(collectSurvey) === 'CE'

export const getUri = (collectSurvey) => getChildElementText('uri')(collectSurvey)

export const visitNodeDefs = ({ collectSurvey, visitor }) => {
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

export const generateArenaNodeDefNamesByPath = (collectSurvey) => {
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
