import * as Node from '@core/record/node'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import { ValidationUtils } from '@core/validation/validationUtils'

import type { CleaningI18n } from './validationRows'

/**
 * Formats the value of a node.
 * @returns {string|null} The formatted value, or null when empty.
 */
export const formatNodeValue = ({ survey, cycle, node }: { survey: any; cycle: string; node: any }): string | null => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  return NodeValueFormatter.format({ survey, cycle, nodeDef, node, value: Node.getValue(node) })
}

/**
 * Returns the formatted root keys of a record.
 * @returns {string} The key values, comma separated.
 */
export const describeRecordKeys = ({ survey, cycle, record }: { survey: any; cycle: string; record: any }): string =>
  NodeValueFormatter.getFormattedRecordKeys({ survey, cycle, record }).join(', ')

/**
 * Returns the label of a node def in the language, or its name when no language is given (for the model).
 * @param {string} [lang] - Label language.
 * @returns {string} The label or the name.
 */
const getNodeDefText = (nodeDef: any, lang?: string): string =>
  lang ? NodeDef.getLabel(nodeDef, lang) : NodeDef.getName(nodeDef)

/**
 * Describes one entity of a path: its name, with its keys when it is the root or a multiple entity.
 * @param {object} params - Parameters.
 * @param {string} [params.lang] - Label language: labels instead of names.
 * @returns {string} E.g. tree[2].
 */
const describeEntity = ({
  survey,
  cycle,
  record,
  entity,
  lang,
}: {
  survey: any
  cycle: string
  record: any
  entity: any
  lang?: string
}) => {
  const entityDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(entity))(survey)
  const name = getNodeDefText(entityDef, lang)
  if (NodeDef.isSingleEntity(entityDef) && !NodeDef.isRoot(entityDef)) return name
  const keyValues = Record.getEntityKeyNodes(
    survey,
    entity
  )(record).map((keyNode: any) => formatNodeValue({ survey, cycle, node: keyNode }))
  return keyValues.length > 0 ? `${name}[${keyValues.join(', ')}]` : name
}

/**
 * Returns the entity ancestors of a node, root first.
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
 * @param {string} [params.lang] - Label language: labels instead of names.
 * @returns {string} E.g. cluster[12] / plot[1] / tree[2] / dbh.
 */
export const describeNodePath = ({
  survey,
  cycle,
  record,
  node,
  lang,
}: {
  survey: any
  cycle: string
  record: any
  node: any
  lang?: string
}) => {
  const parts = getAncestorsRootFirst(record, node).map((entity) =>
    describeEntity({ survey, cycle, record, entity, lang })
  )
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  parts.push(
    NodeDef.isEntity(nodeDef)
      ? describeEntity({ survey, cycle, record, entity: node, lang })
      : getNodeDefText(nodeDef, lang)
  )
  return parts.join(' / ')
}

/**
 * Describes the parent entity of a node (its path with keys).
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
 * @returns {{nodeUuid: string, nodeDefUuid: string}} The page entity.
 */
export const getNodePage = ({ record, node }: { record: any; node: any }) => {
  const parent = Record.getParentNode(node)(record) ?? node
  return { nodeUuid: Node.getUuid(parent), nodeDefUuid: Node.getNodeDefUuid(parent) }
}

/**
 * Returns the translated validation messages of a node (empty when valid).
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
