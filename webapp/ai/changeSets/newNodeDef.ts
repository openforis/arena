/**
 * New node definitions proposed by the assistant, with the form designer's default props (deviation 6: duplicated
 * from NodeDefUIProps, whose module loads React components).
 */
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

export const assistantNodeDefTypes = [
  'entity',
  'text',
  'integer',
  'decimal',
  'boolean',
  'date',
  'time',
  'coordinate',
] as const

export type AssistantNodeDefType = (typeof assistantNodeDefTypes)[number]

/**
 * Returns true for the types the assistant may create (code and taxon need categories and taxonomies: later).
 * @param {string} type - Node definition type.
 * @returns {boolean} True when allowed.
 */
export const isAssistantNodeDefType = (type: string): type is AssistantNodeDefType =>
  (assistantNodeDefTypes as readonly string[]).includes(type)

/**
 * Returns the designer's default props: a multiple entity is a table, a single entity a form in the parent page.
 * @param {object} params - Parameters.
 * @param {string} params.type - Type.
 * @param {string[]} params.cycles - Cycles of the node definition.
 * @param {boolean} params.multiple - Multiple entity.
 * @returns {object} The props.
 */
export const getDefaultPropsByType = ({
  type,
  cycles,
  multiple,
}: {
  type: string
  cycles: string[]
  multiple: boolean
}) => {
  if (type !== 'entity') return {}
  const renderType = multiple ? NodeDefLayout.renderType.table : NodeDefLayout.renderType.form
  const layout = Object.assign({}, ...cycles.map((cycle) => NodeDefLayout.newLayout(cycle, renderType)))
  return { [NodeDef.propKeys.layout]: layout }
}

const nonEmpty = (texts: Record<string, string> | undefined) => (texts && Object.keys(texts).length > 0 ? texts : null)

/**
 * Creates a node definition for a proposal. Not temporary: its uuid is final, so later operations can refer to it.
 * @param {object} params - Parameters.
 * @param {object} params.parent - Parent entity.
 * @param {string} params.type - Type.
 * @param {string[]} [params.cycles] - Cycles (default: those of the parent, so the node definition exists wherever its
 * parent does).
 * @param {string} [params.cycle] - A single cycle, instead of `cycles` (what the designer does: the current cycle).
 * @param {string} params.name - Name.
 * @param {object} [params.labels] - Labels by language.
 * @param {object} [params.descriptions] - Descriptions by language.
 * @param {boolean} [params.key] - Key attribute.
 * @param {boolean} [params.multiple] - Multiple (default: true for entities, as in the designer).
 * @param {boolean} [params.readOnly] - Read only.
 * @returns {object} The node definition.
 */
export const createProposedNodeDef = ({
  parent,
  type,
  cycle,
  cycles = cycle ? [cycle] : NodeDef.getCycles(parent),
  name,
  labels,
  descriptions,
  key = false,
  multiple = type === 'entity',
  readOnly = false,
}: {
  parent: any
  type: string
  cycle?: string
  cycles?: string[]
  name: string
  labels?: Record<string, string>
  descriptions?: Record<string, string>
  key?: boolean
  multiple?: boolean
  readOnly?: boolean
}): any => {
  const { propKeys } = NodeDef
  const labelsProp = nonEmpty(labels)
  const descriptionsProp = nonEmpty(descriptions)
  const props = {
    [propKeys.name]: name,
    ...(labelsProp ? { [propKeys.labels]: labelsProp } : {}),
    ...(descriptionsProp ? { [propKeys.descriptions]: descriptionsProp } : {}),
    ...(key ? { [propKeys.key]: true } : {}),
    ...(multiple ? { [propKeys.multiple]: true } : {}),
    ...(readOnly ? { [propKeys.readOnly]: true } : {}),
    ...getDefaultPropsByType({ type, cycles, multiple }),
  }
  return NodeDef.dissocTemporary(NodeDef.newNodeDef(parent, type, cycles, props))
}
