const R = require('ramda')

const CollectIdmlParseUtils = require('../metaImportJobs/collectIdmlParseUtils')

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

const getTextValue = prop => R.path([prop, '_text'])

const getTextValues = valObj => R.pipe(
  R.keys,
  R.reduce((acc, prop) => R.assoc(prop, getTextValue(prop)(valObj), acc), {})
)(valObj)

const getCollectNodeDefByPath = (collectSurvey, collectNodeDefPath) => {
  const collectAncestorNodeNames = R.pipe(
    R.split('/'),
    R.reject(R.isEmpty)
  )(collectNodeDefPath)

  let currentCollectNode = CollectIdmlParseUtils.getElementByName('schema')(collectSurvey)

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

module.exports = {
  toList,
  getList,

  getTextValue,
  getTextValues,

  getCollectNodeDefByPath
}