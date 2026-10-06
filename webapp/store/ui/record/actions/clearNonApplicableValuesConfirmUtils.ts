import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

const maxNodeDefLabelsShown = 10

/**
 * Generates the list of labels of the node definitions whose values will be cleared:
 * cleared multiple entities first, then the attributes not inside them.
 * @param {!object} params - The parameters.
 * @param {!object} params.survey - The survey.
 * @param {!string} params.lang - The language of the labels.
 * @param {!string[]} params.nodeDefUuidsToClear - The uuids of the node definitions whose values will be cleared.
 * @returns {string[]} - The labels, as markdown list items.
 */
export const getNodeDefLabelsToShow = ({
  survey,
  lang,
  nodeDefUuidsToClear,
}: {
  survey: any
  lang: string
  nodeDefUuidsToClear: string[]
}): string[] => {
  const nodeDefs = nodeDefUuidsToClear.map((uuid) => Survey.getNodeDefByUuid(uuid)(survey)).filter(Boolean)
  const multipleEntityDefs = nodeDefs.filter(NodeDef.isMultipleEntity)
  const multipleEntityDefUuids = new Set(multipleEntityDefs.map(NodeDef.getUuid))
  const otherDefs = nodeDefs.filter((nodeDef) => {
    if (multipleEntityDefUuids.has(NodeDef.getUuid(nodeDef))) return false
    const ancestorMultipleEntity = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
    return !ancestorMultipleEntity || !multipleEntityDefUuids.has(NodeDef.getUuid(ancestorMultipleEntity))
  })
  const labels = [...multipleEntityDefs, ...otherDefs].map((nodeDef) => `- ${NodeDef.getLabel(nodeDef, lang)}`)
  if (labels.length <= maxNodeDefLabelsShown) return labels
  return [...labels.slice(0, maxNodeDefLabelsShown), '- …']
}

/**
 * Prepares the nodes (as stored on the server) to restore in the record being edited.
 * They are marked as dirty so that they replace the nodes being edited locally.
 * @param {!object[]} nodesToRestore - The nodes to restore.
 * @returns {object} - The nodes to restore indexed by uuid.
 */
export const prepareNodesToRestore = (nodesToRestore: any[]): Record<string, any> =>
  Object.fromEntries(nodesToRestore.map((node) => [Node.getUuid(node), Node.assocDirty(true)(node)]))
