const R = require('ramda')

const NodeDef = require('../../../../../../common/survey/nodeDef')
const { nodeDefType } = NodeDef

const collectNodeDefTypes = {
  boolean: 'boolean',
  code: 'code',
  coordinate: 'coordinate',
  date: 'date',
  entity: 'entity',
  file: 'file',
  number: 'number',
  taxon: 'taxon',
  text: 'text',
  time: 'time'
}

const nodeDefTypesExtractorByCollectType = {
  [collectNodeDefTypes.boolean]: () => nodeDefType.boolean,
  [collectNodeDefTypes.code]: () => nodeDefType.code,
  [collectNodeDefTypes.coordinate]: () => nodeDefType.coordinate,
  [collectNodeDefTypes.date]: () => nodeDefType.date,
  [collectNodeDefTypes.entity]: () => nodeDefType.entity,
  [collectNodeDefTypes.file]: () => nodeDefType.file,
  [collectNodeDefTypes.number]: collectNodeDef =>
    getAttribute('type')(collectNodeDef) === 'real'
      ? nodeDefType.decimal
      : nodeDefType.integer,
  [collectNodeDefTypes.taxon]: () => nodeDefType.taxon,
  [collectNodeDefTypes.text]: () => nodeDefType.text,
  [collectNodeDefTypes.time]: () => nodeDefType.time,
}

const getNodeDefTypeByCollectNodeDef = collectNodeDef => {
  const collectType = getElementName(collectNodeDef)
  const typeExtractor = nodeDefTypesExtractorByCollectType[collectType]
  return typeExtractor && typeExtractor(collectNodeDef)
}

const keys = {
  attributes: 'attributes',
  elements: 'elements',
  name: 'name',
  type: 'type',
  lang: 'xml:lang',
  text: 'text',
}

const layoutTypes = {
  table: 'table',
}

const toLabels = (elName, defaultLang, typeFilter = null) =>
  xml =>
    R.pipe(
      getElementsByName(elName),
      R.reduce((acc, l) => {
        const lang = getAttribute(keys.lang, defaultLang)(l)
        const type = getAttribute(keys.type)(l)

        return typeFilter === null || type === typeFilter
          ? R.assoc(lang, getText(l), acc)
          : acc
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
      console.log(`child node def ${collectAncestorNodeName} not found in node def ${currentCollectNode}`)
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

  getNodeDefTypeByCollectNodeDef,

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
  getNodeDefByPath,
  getNodeDefChildByName,
  getNodeDefChildren
}