import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'
import { ValidationUtils } from '@core/validation/validationUtils'

import type { CleaningI18n } from './validationRows'

/**
 * Formats the value of a node.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.cycle - Cycle key.
 * @param {object} params.node - The node.
 * @returns {string|null} The formatted value, or null when empty.
 */
export const formatNodeValue = ({ survey, cycle, node }: { survey: any; cycle: string; node: any }): string | null => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  return NodeValueFormatter.format({ survey, cycle, nodeDef, node, value: Node.getValue(node) })
}

/**
 * Returns the formatted root keys of a record.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.cycle - Cycle key.
 * @param {object} params.record - The record.
 * @returns {string} The key values, comma separated.
 */
export const describeRecordKeys = ({ survey, cycle, record }: { survey: any; cycle: string; record: any }): string =>
  NodeValueFormatter.getFormattedRecordKeys({ survey, cycle, record }).join(', ')

/**
 * Describes one entity of a path: its name, with its keys when it is the root or a multiple entity.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.cycle - Cycle key.
 * @param {object} params.record - The record.
 * @param {object} params.entity - The entity.
 * @returns {string} E.g. tree[2].
 */
const describeEntity = ({
  survey,
  cycle,
  record,
  entity,
}: {
  survey: any
  cycle: string
  record: any
  entity: any
}) => {
  const entityDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(entity))(survey)
  const name = NodeDef.getName(entityDef)
  if (NodeDef.isSingleEntity(entityDef) && !NodeDef.isRoot(entityDef)) return name
  const keyValues = Record.getEntityKeyNodes(
    survey,
    entity
  )(record).map((keyNode: any) => formatNodeValue({ survey, cycle, node: keyNode }))
  return keyValues.length > 0 ? `${name}[${keyValues.join(', ')}]` : name
}

/**
 * Returns the entity ancestors of a node, root first.
 * @param {object} record - The record.
 * @param {object} node - The node.
 * @returns {object[]} The ancestors.
 */
const getAncestorsRootFirst = (record: any, node: any): any[] => {
  const ancestors: any[] = []
  let current = Record.getParentNode(node)(record)
  while (current) {
    ancestors.unshift(current)
    current = Record.getParentNode(current)(record)
  }
  return ancestors
}

/**
 * Describes the path of a node with the keys of its ancestor entities.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.cycle - Cycle key.
 * @param {object} params.record - The record.
 * @param {object} params.node - The node.
 * @returns {string} E.g. cluster[12] / plot[1] / tree[2] / dbh.
 */
export const describeNodePath = ({
  survey,
  cycle,
  record,
  node,
}: {
  survey: any
  cycle: string
  record: any
  node: any
}) => {
  const parts = getAncestorsRootFirst(record, node).map((entity) => describeEntity({ survey, cycle, record, entity }))
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  parts.push(
    NodeDef.isEntity(nodeDef) ? describeEntity({ survey, cycle, record, entity: node }) : NodeDef.getName(nodeDef)
  )
  return parts.join(' / ')
}

/**
 * Describes the parent entity of a node (its path with keys).
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.cycle - Cycle key.
 * @param {object} params.record - The record.
 * @param {object} params.node - The node.
 * @returns {string} E.g. cluster[12] / plot[1] / tree[2].
 */
export const describeParentPath = ({
  survey,
  cycle,
  record,
  node,
}: {
  survey: any
  cycle: string
  record: any
  node: any
}) => {
  const parent = Record.getParentNode(node)(record)
  return parent ? describeNodePath({ survey, cycle, record, node: parent }) : ''
}

/**
 * Returns the record editor page of a node: its parent entity.
 * @param {object} params - Parameters.
 * @param {object} params.record - The record.
 * @param {object} params.node - The node.
 * @returns {{nodeUuid: string, nodeDefUuid: string}} The page entity.
 */
export const getNodePage = ({ record, node }: { record: any; node: any }) => {
  const parent = Record.getParentNode(node)(record) ?? node
  return { nodeUuid: Node.getUuid(parent), nodeDefUuid: Node.getNodeDefUuid(parent) }
}

/**
 * Returns the translated validation messages of a node (empty when valid).
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.record - The record.
 * @param {object} params.node - The node.
 * @param {CleaningI18n} params.i18n - Translator.
 * @returns {string[]} The messages.
 */
export const getNodeValidationMessages = ({
  survey,
  record,
  node,
  i18n,
}: {
  survey: any
  record: any
  node: any
  i18n: CleaningI18n
}) => {
  const validation = RecordValidation.getNodeValidation(node)(Validation.getValidation(record))
  if (!validation || Validation.isValid(validation)) return []
  return ValidationUtils.getJointMessages({ i18n, survey, showKeys: false })(validation).map(({ text }) => text.trim())
}
