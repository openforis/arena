const XmlParser = require('fast-xml-parser')
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

const toLabels = (labelSource, defaultLang, typeFilter = null) => {
  const list = toList(labelSource)

  return R.reduce((acc, l) => {
    if (R.is(Object, l)) {
      const lang = R.pathOr(defaultLang, ['_attr', 'xml:lang'], l)
      const type = R.path(['_attr', 'type'], l)

      if (typeFilter === null || type === typeFilter) {
        return R.assoc(lang, l._text, acc)
      } else {
        return acc
      }
    } else {
      return R.assoc(defaultLang, l, acc)
    }
  }, {}, list)
}

const toList = R.pipe(
  R.defaultTo([]),
  R.ifElse(
    R.is(Array),
    R.identity,
    l => [l]
  )
)

const getList = path => R.pipe(
  R.path(path),
  toList
)

const parseXmlToJson = xml => {
  const options = {
    attrNodeName: '_attr',
    attributeNamePrefix: '',
    textNodeName: '_text',
    ignoreAttributes: false,
    format: false,
    indentBy: '  ',
  }
  const traversalObj = XmlParser.getTraversalObj(xml, options)
  return XmlParser.convertToJson(traversalObj, options)
}

module.exports = {
  nodeDefTypesByCollectType,

  toLabels,
  toList,
  getList,

  parseXmlToJson
}