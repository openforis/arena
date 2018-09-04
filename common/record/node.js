const R = require('ramda')

const {uuidv4} = require('./../uuid')
const {isBlank} = require('../stringUtils')

/**
 * ======
 * CREATE
 * ======
 */

const newNode = (nodeDefId, recordId, parentId = null, placeholder = false, value = null) => {
  return {
    uuid: uuidv4(),
    nodeDefId,
    recordId,
    parentId,
    placeholder,
    value,
  }
}

const newNodePlaceholder = (nodeDef, parentNode, value = null) =>
  newNode(nodeDef.id, parentNode.recordId, parentNode.id, true, value)

/**
 * ======
 * READ
 * ======
 */

const getNodeValue = (node = {}, defaultValue = {}) => R.pipe(
  R.prop('value'),
  R.defaultTo(defaultValue)
)(node)

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

  // ==== UTILS
  isNodeValueBlank,
  isNodeValueNotBlank,
}