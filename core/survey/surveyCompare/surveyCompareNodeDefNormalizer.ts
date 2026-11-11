import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'

import { NodeDefsIndex, getNameByUuid } from './surveyCompareNodeDefsIndex'
import { normalizeValue } from './surveyCompareValues'

export interface NormalizedNodeDef {
  structure: Record<string, any>
  props: Record<string, any>
  propsAdvanced: Record<string, any>
  layoutByCycle: Record<string, any>
}

const mapLayoutChild = (index: NodeDefsIndex) => (layoutChild: any) =>
  typeof layoutChild === 'string'
    ? getNameByUuid(index, layoutChild)
    : { ...layoutChild, i: getNameByUuid(index, layoutChild.i) }

// replaces node def uuids with names, so layouts of surveys created separately can be compared
const normalizeCycleLayout = ({ index, cycleLayout }: { index: NodeDefsIndex; cycleLayout: any }): any => {
  if (!cycleLayout) return undefined
  const {
    [NodeDefLayout.keys.layoutChildren]: layoutChildren,
    [NodeDefLayout.keys.indexChildren]: indexChildren,
    [NodeDefLayout.keys.pageUuid]: pageUuid,
    ...otherProps
  } = cycleLayout
  return normalizeValue({
    ...otherProps,
    ownPage: Boolean(pageUuid),
    layoutChildren: layoutChildren?.map(mapLayoutChild(index)),
    indexChildren: indexChildren?.map((uuid: string) => getNameByUuid(index, uuid)),
  })
}

const resolveReferences = ({ index, props }: { index: NodeDefsIndex; props: Record<string, any> }) => {
  const { survey } = index
  const result = { ...props }
  const { categoryUuid, taxonomyUuid, parentCodeDefUuid, cycles } = props
  if (categoryUuid) {
    const category = Survey.getCategoryByUuid(categoryUuid)(survey)
    result.categoryUuid = category ? Category.getName(category) : categoryUuid
  }
  if (taxonomyUuid) {
    const taxonomy = Survey.getTaxonomyByUuid(taxonomyUuid)(survey)
    result.taxonomyUuid = taxonomy ? Taxonomy.getName(taxonomy) : taxonomyUuid
  }
  if (parentCodeDefUuid) {
    result.parentCodeDefUuid = index.pathByUuid[parentCodeDefUuid] ?? parentCodeDefUuid
  }
  if (Array.isArray(cycles)) {
    result.cycles = [...cycles].sort((a, b) => a.localeCompare(b))
  }
  return result
}

/**
 * Normalizes a node def for comparison: uuids of references are replaced with names, layout is split by cycle.
 * @param {object} params - The parameters.
 * @param {NodeDefsIndex} params.index - Node defs index of the survey the node def belongs to.
 * @param {any} params.nodeDef - The node def to normalize.
 * @returns {NormalizedNodeDef} - The normalized node def.
 */
export const normalizeNodeDef = ({ index, nodeDef }: { index: NodeDefsIndex; nodeDef: any }): NormalizedNodeDef => {
  const { [NodeDefLayout.keys.layout]: layout = {}, ...props } = NodeDef.getProps(nodeDef)

  const layoutByCycle = {}
  for (const [cycle, cycleLayout] of Object.entries(layout ?? {})) {
    layoutByCycle[cycle] = normalizeCycleLayout({ index, cycleLayout })
  }
  return {
    structure: { type: NodeDef.getType(nodeDef) },
    props: normalizeValue(resolveReferences({ index, props })) ?? {},
    propsAdvanced: normalizeValue(NodeDef.getPropsAdvanced(nodeDef)) ?? {},
    layoutByCycle,
  }
}
