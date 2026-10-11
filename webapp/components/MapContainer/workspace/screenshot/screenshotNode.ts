import * as Node from '@core/record/node'

export type ScreenshotFileValue = Record<string, string | number>

export type ScreenshotNodeChangeInput = {
  nodes: any[]
  recordUuid: string
  parentUuid: string // node uuid of the entity holding the location attribute of the plot
  entityDefUuid: string // the plot entity definition
  attributeDefUuid: string
  attributeParentDefUuid: string
  attributeMultiple: boolean
  value: ScreenshotFileValue
}

export type ScreenshotNodeChange = {
  ok: boolean
  errorKey?: 'plotNotFound'
  kind?: 'create' | 'update'
  node?: any
  replacedFileName?: string | null
}

export type NodePersistField = { name: string; value: string | Blob; fileName?: string }

/**
 * Builds the value of a file attribute holding the screenshot.
 * @param {object} params - The parameters.
 * @param {string} params.fileUuid - New file uuid.
 * @param {string} params.fileName - File name.
 * @param {number} params.fileSize - File size in bytes.
 * @returns {ScreenshotFileValue} The node value.
 */
export const buildScreenshotFileValue = ({
  fileUuid,
  fileName,
  fileSize,
}: {
  fileUuid: string
  fileName: string
  fileSize: number
}): ScreenshotFileValue => ({
  [Node.valuePropsFile.fileUuid]: fileUuid,
  [Node.valuePropsFile.fileName]: fileName,
  [Node.valuePropsFile.fileSize]: fileSize,
})

/**
 * Finds a node, or its nearest ancestor, of the specified definition.
 * @param {object} params - The parameters.
 * @param {Map<string, object>} params.nodesByUuid - Record nodes by uuid.
 * @param {string} params.startUuid - Uuid of the node to start from.
 * @param {string} params.nodeDefUuid - Definition to look for.
 * @returns {object|null} The node, or null when not found.
 */
const findSelfOrAncestorOfDef = ({
  nodesByUuid,
  startUuid,
  nodeDefUuid,
}: {
  nodesByUuid: Map<string, any>
  startUuid: string
  nodeDefUuid: string
}): any | null => {
  let current = nodesByUuid.get(startUuid) ?? null
  let steps = 0
  // the step limit protects against a malformed parent chain
  while (current && steps <= nodesByUuid.size) {
    if (Node.getNodeDefUuid(current) === nodeDefUuid) return current
    current = nodesByUuid.get(Node.getParentUuid(current)) ?? null
    steps += 1
  }
  return null
}

/**
 * Finds the entity node that holds the image attribute: the plot itself or one of its descendant single entities.
 * @param {object} params - The parameters.
 * @param {Array<object>} params.nodes - Record nodes.
 * @param {object} params.plotNode - The plot entity node.
 * @param {string} params.attributeParentDefUuid - Definition of the entity holding the attribute.
 * @returns {object|null} The parent node, or null when not found.
 */
const findAttributeParentNode = ({
  nodes,
  plotNode,
  attributeParentDefUuid,
}: {
  nodes: any[]
  plotNode: any
  attributeParentDefUuid: string
}): any | null => {
  if (Node.getNodeDefUuid(plotNode) === attributeParentDefUuid) return plotNode
  return (
    nodes.find((node) => Node.getNodeDefUuid(node) === attributeParentDefUuid && Node.isDescendantOf(plotNode)(node)) ??
    null
  )
}

/**
 * Builds the node to send: an update of the existing single attribute, or a new attribute node.
 * @param {ScreenshotNodeChangeInput} input - The record nodes, the plot and the attribute.
 * @returns {ScreenshotNodeChange} The change, or an error key when the plot is not in the record.
 */
export const buildScreenshotNodeChange = (input: ScreenshotNodeChangeInput): ScreenshotNodeChange => {
  const {
    nodes,
    recordUuid,
    parentUuid,
    entityDefUuid,
    attributeDefUuid,
    attributeParentDefUuid,
    attributeMultiple,
    value,
  } = input
  const nodesByUuid = new Map(nodes.map((node) => [Node.getUuid(node), node]))
  const plotNode = findSelfOrAncestorOfDef({ nodesByUuid, startUuid: parentUuid, nodeDefUuid: entityDefUuid })
  const parentNode = plotNode ? findAttributeParentNode({ nodes, plotNode, attributeParentDefUuid }) : null
  if (!parentNode) return { ok: false, errorKey: 'plotNotFound' }

  const parentNodeUuid = Node.getUuid(parentNode)
  const existing = attributeMultiple
    ? null
    : (nodes.find(
        (node) => Node.getNodeDefUuid(node) === attributeDefUuid && Node.getParentUuid(node) === parentNodeUuid
      ) ?? null)
  if (existing) {
    const existingFileUuid = Node.getFileUuid(existing)
    return {
      ok: true,
      kind: 'update',
      node: { ...existing, [Node.keys.value]: value },
      replacedFileName: existingFileUuid ? Node.getFileName(existing) || existingFileUuid : null,
    }
  }
  return {
    ok: true,
    kind: 'create',
    node: Node.newNode(attributeDefUuid, recordUuid, parentNode, value),
    replacedFileName: null,
  }
}

/**
 * Builds the multipart fields of POST /api/survey/:surveyId/record/:recordUuid/node.
 * @param {object} params - The parameters.
 * @param {object} params.node - The node to persist.
 * @param {string} params.cycle - The record cycle.
 * @param {number} params.timezoneOffset - The browser time zone offset (Dates.getTimezoneOffset()).
 * @param {string} params.lang - The UI language.
 * @param {Blob} params.file - The PNG.
 * @param {string} params.fileName - The file name.
 * @returns {Array<NodePersistField>} The fields, in order.
 */
export const buildNodePersistFields = ({
  node,
  cycle,
  timezoneOffset,
  lang,
  file,
  fileName,
}: {
  node: unknown
  cycle: string
  timezoneOffset: number
  lang: string
  file: Blob
  fileName: string
}): NodePersistField[] => [
  { name: 'node', value: JSON.stringify(node) },
  { name: 'cycle', value: String(cycle) },
  { name: 'draft', value: 'false' },
  { name: 'timezoneOffset', value: String(timezoneOffset) },
  { name: 'lang', value: lang },
  { name: 'file', value: file, fileName },
]

/**
 * Appends the fields to a form data object; the file keeps its name.
 * @param {Array<NodePersistField>} fields - The fields.
 * @param {object} formData - A FormData (or any object with the same append method).
 * @returns {object} The same form data object.
 */
export const fieldsToFormData = <T extends Pick<FormData, 'append'>>(fields: NodePersistField[], formData: T): T => {
  for (const field of fields) {
    if (field.fileName === undefined) {
      formData.append(field.name, field.value as string)
    } else {
      formData.append(field.name, field.value as Blob, field.fileName)
    }
  }
  return formData
}
