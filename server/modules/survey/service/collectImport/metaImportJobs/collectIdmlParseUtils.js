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

const toLabels = (elName, defaultLang, typeFilter = null) =>
  xml =>
    R.pipe(
      getElementsByName(elName),
      R.reduce((acc, l) => {
        const lang = R.pathOr(defaultLang, ['attributes', 'xml:lang'], l)
        const type = R.path(['attributes', 'type'], l)

        return typeFilter === null || type === typeFilter
          ? R.assoc(lang, getText(l), acc)
          : acc
      }, {})
    )(xml)

const getElementsByName = name => R.pipe(
  R.propOr([], 'elements'),
  R.filter(R.propEq('name', name))
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

const getText = R.pipe(
  R.prop('elements'),
  R.find(R.propEq('type', 'text')),
  R.prop('text')
)

module.exports = {
  nodeDefTypesByCollectType,

  toLabels,
  getElementsByName,
  getElementByName,
  getElementsByPath,
  getText,
  getElementText: name => R.pipe(getElementByName(name), getText),
}