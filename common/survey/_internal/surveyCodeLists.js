const R = require('ramda')

const codeLists = 'codeLists'

// ====== READ
const getCodeLists = R.pipe(
  R.prop(codeLists),
  R.defaultTo({})
)

const getCodeListsArray = R.pipe(
  getCodeLists,
  R.values,
)

const getCodeListByUUID = uuid => R.pipe(
  getCodeLists,
  R.prop(uuid)
)

// ====== UPDATE
const assocCodeLists = newCodeLists => R.assoc(codeLists, newCodeLists)

module.exports = {
  getCodeLists,
  getCodeListsArray,
  getCodeListByUUID,

  assocCodeLists,
}