const R = require('ramda')

const {uuidv4} = require('./../uuid')
const {isBlank} = require('../stringUtils')

/**
 * ======
 * CREATE
 * ======
 */

const newNode = (nodeDefUuid, recordId, parentUUID = null, placeholder = false, value = null) => {
  return {
    uuid: uuidv4(),
    nodeDefUuid,
    recordId,
    parentUUID,
    placeholder,
    value,
  }
}

const newNodePlaceholder = (nodeDef, parentNode, value = null) =>
  newNode(nodeDef.uuid, parentNode.recordId, parentNode.uuid, true, value)

/**
 * ======
 * READ
 * ======
 */

const getNodeValue = (node = {}, defaultValue = {}) =>
  R.propOr(defaultValue, 'value', node)

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
  getNodeDefUuid: R.prop('nodeDefUuid'),
  getNodeRecordId: R.prop('recordId'),
  getNodeFileName: getNodeValueProp('fileName', ''),
  getNodeItemUUID: getNodeValueProp('itemUUID'),
  getNodeTaxonUUID: getNodeValueProp('taxonUUID'),
  getNodeVernacularNameUUID: getNodeValueProp('vernacularNameUUID'),

  // ==== UTILS
  isNodeValueBlank,
  isNodeValueNotBlank,
}