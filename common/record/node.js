const R = require('ramda')

const {uuidv4} = require('./../uuid')
const {isBlank} = require('../stringUtils')

const valuePropName = 'value'

/**
 * ======
 * CREATE
 * ======
 */

const newNode = (nodeDefUuid, recordUuid, parentUuid = null, value = null) => ({
    uuid: uuidv4(),
    nodeDefUuid,
    recordUuid,
    parentUuid,
    value,
  }
)

const newNodePlaceholder = (nodeDef, parentNode, value = null) => ({
  ...newNode(nodeDef.uuid, parentNode.recordUuid, parentNode.uuid, value),
  placeholder: true
})

/**
 * ======
 * READ
 * ======
 */

const getNodeValue = (node = {}, defaultValue = {}) =>
  R.propOr(defaultValue, valuePropName, node)

const getNodeValueProp = (prop, defaultValue = null) => R.pipe(
  getNodeValue,
  R.propOr(defaultValue, prop),
)

/**
 * ======
 * UPDATE
 * ======
 */

/**
 * ======
 * UTILS
 * ======
 */
const isNodeValueBlank = value => {

  if (R.isNil(value))
    return true

  if (R.is(String, value))
    return isBlank(value)

  return false
}

const isNodeValueNotBlank = R.pipe(isNodeValueBlank, R.not)

module.exports = {
  // ==== CREATE
  newNode,
  newNodePlaceholder,

  // ==== READ
  getNodeValue,
  getParentUuid: R.prop('parentUuid'),
  getNodeDefUuid: R.prop('nodeDefUuid'),
  getNodeRecordUuid: R.prop('recordUuid'),
  getNodeFileName: getNodeValueProp('fileName', ''),
  getNodeItemUuid: getNodeValueProp('itemUuid'),
  getNodeTaxonUuid: getNodeValueProp('taxonUuid'),
  getNodeVernacularNameUuid: getNodeValueProp('vernacularNameUuid'),

  // ==== UPDATE
  assocValue: R.assoc(valuePropName),

  // ==== UTILS
  isNodeValueBlank,
  isNodeValueNotBlank,
}