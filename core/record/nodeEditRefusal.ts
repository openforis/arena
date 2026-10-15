import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

export type NodeEditRefusal = 'readOnly' | 'notApplicable'

/**
 * Finds why the form would not let the user edit a node: the node, or any entity above it, is read-only ("editable if")
 * or not applicable ("applicable if") in its parent. The nearest ancestor is checked first.
 * @param {object} params - The parameters.
 * @param {object} params.record - The record.
 * @param {object} params.node - The node.
 * @returns {NodeEditRefusal|null} The reason of the refusal, or null when the node may be edited.
 */
export const findNodeEditRefusal = ({ record, node }: { record: any; node: any }): NodeEditRefusal | null => {
  const visited = new Set<string>()
  let child = node
  let parent = Record.getParentNode(child)(record)
  // the visited set guards against a corrupted record with a parent cycle
  while (parent && !visited.has(Node.getUuid(parent))) {
    visited.add(Node.getUuid(parent))
    const childDefUuid = Node.getNodeDefUuid(child)
    if (!Node.isChildEditable(childDefUuid)(parent)) return 'readOnly'
    if (!Node.isChildApplicable(childDefUuid)(parent)) return 'notApplicable'
    child = parent
    parent = Record.getParentNode(child)(record)
  }
  return null
}
