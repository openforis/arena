import * as R from 'ramda'

import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import Queue from '@core/queue'

export const newRecord = (user, preview = false) => Record.newRecord(user, Survey.cycleOneKey, preview)

export const insertAndInitRecord = async (user, survey, preview = false, client = db) =>
  await client.tx(async t => {
    const record = newRecord(user, preview)
    const recordDb = await RecordManager.insertRecord(user, Survey.getId(survey), record, true, t)
    return await RecordManager.initNewRecord(user, survey, recordDb, null, null, t)
  })

export const getNodePath = node => (survey, record) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const parentNode = Record.getParentNode(node)(record)
  if (parentNode) {
    const parentNodePath = getNodePath(parentNode)(survey, record)

    if (NodeDef.isMultiple(nodeDef)) {
      const siblings = Record.getNodeChildrenByDefUuid(parentNode, nodeDefUuid)(record)
      const index = R.findIndex(n => Node.getUuid(n) === Node.getUuid(node), siblings)
      const position = index + 1
      return `${parentNodePath}/${NodeDef.getName(nodeDef)}[${position}]`
    }

    return `${parentNodePath}/${NodeDef.getName(nodeDef)}`
  }

  // Is root
  return NodeDef.getName(nodeDef)
}

export const findNodeByPath = path => (survey, record) => {
  const parts = R.ifElse(R.is(Array), R.identity, R.split('/'))(path)

  let currentNodeDef = null
  let currentNode = null
  let currentParentNode = null
  let currentParentDef = null

  for (const part of parts) {
    if (currentParentNode) {
      // Extract node name and position from path part
      const partMatch = /(\w+)(\[(\d+)\])?/.exec(part)
      const childName = partMatch[1]
      const childPosition = R.defaultTo(1, partMatch[3])

      currentNodeDef = Survey.getNodeDefChildByName(currentParentDef, childName)(survey)

      const children = Record.getNodeChildrenByDefUuid(currentParentNode, NodeDef.getUuid(currentNodeDef))(record)

      if (children.length >= childPosition) {
        currentNode = children[childPosition - 1]
      } else {
        return null
      }
    } else {
      currentNodeDef = Survey.getNodeDefRoot(survey)
      currentNode = Record.getRootNode(record)
    }

    currentParentDef = currentNodeDef
    currentParentNode = currentNode
  }

  return currentNode
}

export const traverse = visitorFn => async record => {
  const root = Record.getRootNode(record)
  const queue = new Queue()
  queue.enqueue(root)

  while (!queue.isEmpty()) {
    const node = queue.dequeue()

    await visitorFn(node)

    const children = Record.getNodeChildren(node)(record)

    queue.enqueueItems(children)
  }
}

export const getValidationChildrenCount = (parentNode, childDef) =>
  R.pipe(
    Validation.getValidation,
    RecordValidation.getValidationChildrenCount(Node.getUuid(parentNode), NodeDef.getUuid(childDef)),
  )
