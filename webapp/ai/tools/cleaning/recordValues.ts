import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import {
  describeParentPath,
  describeRecordKeys,
  formatNodeValue,
  getNodeValidationMessages,
} from './recordNodeDescriber'
import type { CleaningI18n } from './validationRows'

export const RECORD_VALUES_MAX = 100

/**
 * Reads the nodes of some attributes of a record, at most `max` nodes.
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.cycle - Cycle key.
 * @param {object} params.record - The record with its nodes.
 * @param {object[]} params.nodeDefs - Attribute definitions, in the order wanted.
 * @param {CleaningI18n} params.i18n - Translator.
 * @param {number} [params.max] - Node cap.
 * @returns {object} The nodes, the total and the truncated flag.
 */
export const getRecordValues = ({
  survey,
  cycle,
  record,
  nodeDefs,
  i18n,
  max = RECORD_VALUES_MAX,
}: {
  survey: any
  cycle: string
  record: any
  nodeDefs: any[]
  i18n: CleaningI18n
  max?: number
}) => {
  const allNodes = nodeDefs.flatMap((nodeDef) => Record.getNodesByDefUuid(NodeDef.getUuid(nodeDef))(record))
  const nodes = allNodes.slice(0, max).map((node: any) => ({
    nodeUuid: Node.getUuid(node),
    attribute: NodeDef.getName(nodeDefs.find((nodeDef) => NodeDef.getUuid(nodeDef) === Node.getNodeDefUuid(node))),
    parentKeys: describeParentPath({ survey, cycle, record, node }),
    formatted: formatNodeValue({ survey, cycle, node }),
    raw: Node.getValue(node, null),
    validation: getNodeValidationMessages({ survey, record, node, i18n }),
  }))
  return {
    recordUuid: Record.getUuid(record),
    recordKeys: describeRecordKeys({ survey, cycle, record }),
    nodes,
    total: allNodes.length,
    truncated: allNodes.length > max,
  }
}
