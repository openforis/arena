import * as R from 'ramda'

import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'
import * as RecordManager from '@server/modules/record/manager/recordManager'

export const newRecord = (user, preview = false) => Record.newRecord(user, Survey.cycleOneKey, preview)

export const insertAndInitRecord = async (user, survey, preview = false, client = db) =>
  client.tx(async (t) => {
    const record = newRecord(user, preview)
    const recordDb = await RecordManager.insertRecord(user, Survey.getId(survey), record, true, t)
    return RecordManager.initNewRecord({ user, survey, record: recordDb }, t)
  })

export const getNodePath = (node) => (survey, record) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const parentNode = Record.getParentNode(node)(record)
  if (parentNode) {
    const parentNodePath = getNodePath(parentNode)(survey, record)

    if (NodeDef.isMultiple(nodeDef)) {
      const siblings = Record.getNodeChildrenByDefUuid(parentNode, nodeDefUuid)(record)
      const index = R.findIndex((n) => Node.getUuid(n) === Node.getUuid(node), siblings)
      return `${parentNodePath}/${NodeDef.getName(nodeDef)}[${index}]`
    }

    return `${parentNodePath}/${NodeDef.getName(nodeDef)}`
  }

  // Is root
  return NodeDef.getName(nodeDef)
}

export const findNodeByPath = (path) => (survey, record) => {
  const parts = R.ifElse(R.is(Array), R.identity, R.split(/[\\/|.]/))(path)

  let currentNodeDef = null
  let currentNode = null
  let currentParentNode = null
  let currentParentDef = null

  parts.some((part) => {
    if (currentParentNode) {
      // Extract node name and index from path part
      const partMatch = /(\w+)(\[(\d+)\])?/.exec(part)
      const childName = partMatch[1]
      const childIndex = R.defaultTo(0, partMatch[3])

      currentNodeDef = Survey.getNodeDefChildByName(currentParentDef, childName)(survey)

      const children = Record.getNodeChildrenByDefUuid(currentParentNode, NodeDef.getUuid(currentNodeDef))(record)

      if (children.length > childIndex) {
        currentNode = children[childIndex]
      } else {
        currentNode = null
        // break the loop
        return true
      }
    } else {
      currentNodeDef = Survey.getNodeDefRoot(survey)
      currentNode = Record.getRootNode(record)
    }

    currentParentDef = currentNodeDef
    currentParentNode = currentNode

    // continue to iterate
    return false
  })

  return currentNode
}

export const findNodeValueByPath = (path) => (survey, record) => Node.getValue(findNodeByPath(path)(survey, record))

export const getValidationChildrenCount = (parentNode, childDef) =>
  R.pipe(
    Validation.getValidation,
    RecordValidation.getValidationChildrenCount(Node.getUuid(parentNode), NodeDef.getUuid(childDef))
  )
