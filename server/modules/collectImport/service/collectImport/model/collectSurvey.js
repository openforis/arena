const R = require('ramda')

const NodeDef = require('@core/survey/nodeDef')
const { nodeDefType } = NodeDef

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
  time: 'time'
}

const nodeDefFieldsExtractorByCollectType = {
  [collectNodeDefTypes.boolean]: () => [{ type: nodeDefType.boolean }],
  [collectNodeDefTypes.code]: () => [{ type: nodeDefType.code }],
  [collectNodeDefTypes.coordinate]: () => [{ type: nodeDefType.coordinate }],
  [collectNodeDefTypes.date]: () => [{ type: nodeDefType.date }],
  [collectNodeDefTypes.entity]: () => [{ type: nodeDefType.entity }],
  [collectNodeDefTypes.file]: () => [{ type: nodeDefType.file }],
  [collectNodeDefTypes.number]: collectNodeDef => {
    const type = getAttribute('type')(collectNodeDef) === 'real'
      ? nodeDefType.decimal
      : nodeDefType.integer
    return [{ type }]
  },
  [collectNodeDefTypes.range]: collectNodeDef => {
    const type = getAttribute('type')(collectNodeDef) === 'real'
      ? nodeDefType.decimal
      : nodeDefType.integer
    return [
      { type, field: 'from' },
      { type, field: 'to' }
    ]
  },
  [collectNodeDefTypes.taxon]: () => [{ type: nodeDefType.taxon }],
  [collectNodeDefTypes.text]: () => [{ type: nodeDefType.text }],
  [collectNodeDefTypes.time]: () => [{ type: nodeDefType.time }],
}

const layoutTypes = {
  table: 'table',
}

const samplingPointDataCodeListNames = ['sampling_design', 'ofc_sampling_design']

const getNodeDefFieldsByCollectNodeDef = collectNodeDef => {
  const collectType = getElementName(collectNodeDef)
  const fieldsExtractor = nodeDefFieldsExtractorByCollectType[collectType]
  return fieldsExtractor && fieldsExtractor(collectNodeDef)
}

const toLabels = (elName, defaultLang, typesFilter = [], suffix = '') =>
  xml =>
    R.pipe(
      getElementsByName(elName),
      R.reduce((labelsAcc, labelEl) => {
        const lang = getAttribute(keys.lang, defaultLang)(labelEl)
        const type = getAttribute(keys.type)(labelEl)

        if (!R.has(lang, labelsAcc) && (R.isEmpty(typesFilter) || R.includes(type, typesFilter))) {
          const text = getText(labelEl) + suffix
          return R.assoc(lang, text, labelsAcc)
        } else {
          return labelsAcc
        }
      }, {})
    )(xml)

const getElements = R.propOr([], keys.elements)

const getElementsByName = name => R.pipe(
  getElements,
  R.filter(el => getElementName(el) === name)
)

const getElementsByPath = path =>
  xml =>
    R.reduce((acc, pathPart) =>
        R.ifElse(
          R.isNil,
          R.identity,
          R.pipe(
            R.ifElse(
              R.is(Array),
              R.head,
              R.identity
            ),
            getElementsByName(pathPart)
          )
        )(acc)
      , xml, path
    )

const getElementByName = name => R.pipe(
  getElementsByName(name),
  R.head
)

const getNodeDefChildByName = name => R.pipe(
  getElements,
  R.find(el => getNodeDefName(el) === name)
)

const getElementName = R.prop(keys.name)

const getText = R.pipe(
  getElements,
  R.find(R.propEq(keys.type, keys.text)),
  R.prop(keys.text)
)

const getAttributes = R.propOr({}, keys.attributes)

const getAttribute = (name, defaultValue = null) => R.pipe(
  getAttributes,
  R.propOr(defaultValue, name)
)

/**
 * Returns the attribute called 'name' of a node def element
 */
const getNodeDefName = getAttribute('name')

const getAttributeBoolean = name => R.pipe(
  getAttribute(name),
  R.equals('true')
)

const getUiAttribute = (name, defaultValue = null) => collectXmlElement =>
  getAttribute(`n1:${name}`)(collectXmlElement) ||
  getAttribute(`ui:${name}`, defaultValue)(collectXmlElement)

const getNodeDefByPath = collectNodeDefPath => collectSurvey => {
  const collectAncestorNodeNames = R.pipe(
    R.split('/'),
    R.reject(R.isEmpty)
  )(collectNodeDefPath)

  let currentCollectNode = getElementByName('schema')(collectSurvey)

  for (const collectAncestorNodeName of collectAncestorNodeNames) {
    const collectChildNodeDef = R.pipe(
      R.propOr([], 'elements'),
      R.find(R.pathEq(['attributes', 'name'], collectAncestorNodeName))
    )(currentCollectNode)

    if (collectChildNodeDef)
      currentCollectNode = collectChildNodeDef
    else {
      return null //node def not found
    }
  }

  return currentCollectNode
}

const getNodeDefChildren = collectNodeDef => R.pipe(
  getElements,
  R.filter(_isNodeDefElement)
)(collectNodeDef)

const _isNodeDefElement = R.pipe(
  getElementName,
  name => R.includes(name, R.keys(collectNodeDefTypes))
)

module.exports = {
  layoutTypes,

  samplingPointDataCodeListNames,

  getNodeDefFieldsByCollectNodeDef,

  toLabels,
  getElements,
  getElementsByName,
  getElementByName,
  getElementsByPath,
  getElementName,
  getText,
  getChildElementText: name => R.pipe(getElementByName(name), getText),
  getAttributes,
  getAttribute,
  getAttributeName: getNodeDefName,
  getAttributeBoolean,
  getUiAttribute,

  getNodeDefRoot: R.pipe(
    getElementsByPath(['schema', 'entity']),
    R.head
  ),
  getNodeDefByPath,
  getNodeDefChildByName,
  getNodeDefChildren
}