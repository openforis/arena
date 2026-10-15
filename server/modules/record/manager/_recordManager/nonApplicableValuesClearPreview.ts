import * as A from '@core/arena'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as Record from '@core/record/record'
import * as Survey from '@core/survey/survey'

import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'
import { TaxonProviderDefault } from '@server/modules/taxonomy/manager/taxonProviderDefault'

type PreviewParams = {
  user: any
  survey: any
  record: any
  timezoneOffset?: number | null
  lang?: string | null
}

const _findNodeDefUuidsToClear = async ({
  user,
  survey,
  record,
  nodes,
  timezoneOffset,
  lang,
}: PreviewParams & { nodes: Record<string, any> }): Promise<string[]> => {
  const { clearedDefUuids } = await Record.updateNodesDependents({
    user,
    survey,
    record,
    nodes,
    categoryItemProvider: CategoryItemProviderDefault,
    taxonProvider: TaxonProviderDefault,
    timezoneOffset,
    lang: lang ?? Survey.getDefaultLanguage(survey),
    clearNonApplicableValues: true,
    sideEffect: false,
  })
  return Array.from(clearedDefUuids ?? [])
}

const _prepareNodeToPersist = ({ record, node }: { record: any; node: any }): any => {
  const nodeExisting = Record.getNodeByUuid(Node.getUuid(node))(record)
  if (!nodeExisting) {
    return Node.assocCreated(true)(node)
  }
  // keep the server copy of the node (meta, applicability) and apply only the new value
  const refData = node[NodeRefData.keys.refData]
  return A.pipe(
    Node.assocValue(Node.getValue(node)),
    (n: any) => (refData ? NodeRefData.assocRefData(refData)(n) : n),
    Node.assocUpdated(true)
  )(nodeExisting)
}

/**
 * Finds the node definitions whose values would be cleared because they become non-applicable when persisting a node.
 * The record is not modified.
 * @param {!object} params - The parameters.
 * @param {!object} params.user - The user performing the update.
 * @param {!object} params.survey - The survey.
 * @param {!object} params.record - The record.
 * @param {!object} params.node - The node to insert or update.
 * @param {number} [params.timezoneOffset] - The timezone offset of the client.
 * @param {string} [params.lang] - The language used to evaluate expressions.
 * @returns {Promise<string[]>} - The uuids of the node definitions whose values would be cleared.
 */
export const findNodeDefUuidsToClearOnNodePersist = async (
  params: PreviewParams & { node: any }
): Promise<string[]> => {
  const { record, node } = params
  const nodeToPersist = _prepareNodeToPersist({ record, node })
  const recordUpdated = Record.assocNode(nodeToPersist)(record)
  return _findNodeDefUuidsToClear({
    ...params,
    record: recordUpdated,
    nodes: { [Node.getUuid(nodeToPersist)]: nodeToPersist },
  })
}

/**
 * Finds the node definitions whose values would be cleared because they become non-applicable when deleting a node.
 * The record is not modified.
 * @param {!object} params - The parameters.
 * @param {!object} params.user - The user performing the update.
 * @param {!object} params.survey - The survey.
 * @param {!object} params.record - The record.
 * @param {!string} params.nodeUuid - The uuid of the node to delete.
 * @param {number} [params.timezoneOffset] - The timezone offset of the client.
 * @param {string} [params.lang] - The language used to evaluate expressions.
 * @returns {Promise<string[]>} - The uuids of the node definitions whose values would be cleared.
 */
export const findNodeDefUuidsToClearOnNodeDelete = async (
  params: PreviewParams & { nodeUuid: string }
): Promise<string[]> => {
  const { record, nodeUuid } = params
  const node = Record.getNodeByUuid(nodeUuid)(record)
  if (!node) return []
  const nodeDeleted = Node.assocDeleted(true)(node)
  const recordUpdated = Record.assocNode(nodeDeleted)(record)
  return _findNodeDefUuidsToClear({ ...params, record: recordUpdated, nodes: { [nodeUuid]: nodeDeleted } })
}
