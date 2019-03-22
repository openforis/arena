const R = require('ramda')

const NodeDef = require('../../../../../../common/survey/nodeDef')
const { nodeDefType } = NodeDef

const nodeDefTypesByCollectType = {
  boolean: nodeDefType.boolean,
  code: nodeDefType.code,
  coordinate: nodeDefType.coordinate,
  date: nodeDefType.date,
  entity: nodeDefType.entity,
  file: nodeDefType.file,
  number: nodeDefType.decimal,
  taxon: nodeDefType.taxon,
  text: nodeDefType.text,
  time: nodeDefType.time,
}

const keys = {
  attributes: 'attributes',
  elements: 'elements',
  name: 'name',
  type: 'type',
  lang: 'xml:lang',
  text: 'text',
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
  R.filter(el => getName(el) === name)
)

const getElementByName = name => R.pipe(
  getElementsByName(name),
  R.head
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

const getName = R.prop(keys.name)

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

module.exports = {
  nodeDefTypesByCollectType,

  toLabels,
  getElements,
  getElementsByName,
  getElementByName,
  getElementsByPath,
  getName,
  getText,
  getChildElementText: name => R.pipe(getElementByName(name), getText),
  getAttributes,
  getAttribute
}