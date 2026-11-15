import type { NodeDef as ArenaNodeDef, NodeDefType, Survey as ArenaSurvey, Validation } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as NodeKeys from '@core/record/nodeKeys'

// item of the records validation report (one per invalid node)
type ValidationReportItem = Record<string, any>
type ItemGetter<T> = (item: ValidationReportItem) => T

const keys = {
  recordCycle: 'recordCycle',
  recordDateCreated: 'recordDateCreated',
  recordDateModified: 'recordDateModified',
  recordOwnerName: 'recordOwnerName',
  recordOwnerUuid: 'recordOwnerUuid',
  recordStep: 'recordStep',
  recordUuid: 'recordUuid',
  nodeUuid: 'nodeUuid',
  nodeDefUuid: 'nodeDefUuid',
  keysHierarchy: 'keysHierarchy',
  keysSelf: 'keysSelf',
  validation: 'validation',
  validationCountChildDefUuid: 'validationCountChildDefUuid',
} as const

const getProp =
  <T = string>(key: string): ItemGetter<T> =>
  (item) =>
    A.prop(key)(item) as T

export const getRecordCycle = getProp(keys.recordCycle)
export const getRecordStep = getProp(keys.recordStep)
export const getRecordDateCreated = getProp(keys.recordDateCreated)
export const getRecordDateModified = getProp(keys.recordDateModified)
export const getRecordOwnerName = getProp(keys.recordOwnerName)
export const getRecordOwnerUuid = getProp(keys.recordOwnerUuid)
export const getRecordUuid = getProp(keys.recordUuid)
const getNodeUuid = getProp(keys.nodeUuid)
const getNodeDefUuid = getProp(keys.nodeDefUuid)
const getValidationCountChildDefUuid = getProp(keys.validationCountChildDefUuid)
const getKeysSelf: ItemGetter<Record<string, unknown>> = (item) =>
  A.propOr({}, keys.keysSelf)(item) as Record<string, unknown>

const isValidationCount = (item: ValidationReportItem): boolean => !A.isNil(getValidationCountChildDefUuid(item))

export const getNodeDef =
  (survey: ArenaSurvey): ItemGetter<ArenaNodeDef<NodeDefType> | null> =>
  (item) =>
    Survey.getNodeDefByUuid(getNodeDefUuid(item))(survey)

const getKeysHierarchy =
  (survey: ArenaSurvey): ItemGetter<NodeKeys.NodeKeysItem[]> =>
  (item) =>
    A.pipe(
      A.prop(keys.keysHierarchy),
      // If item nodeDef is root, esclude the first item of the hieerarchy (it would be null)
      A.when(A.always(NodeDef.isRoot(getNodeDef(survey)(item))), A.tail),
      // Append node itself to the hierarchy
      A.append({
        keys: getKeysSelf(item),
        nodeDefUuid: getNodeDefUuid(item),
      }),
      // Append validation count child node def to the hierarchy, if any
      A.when(
        A.always(isValidationCount(item)),
        A.append({
          keys: [],
          nodeDefUuid: getValidationCountChildDefUuid(item),
        })
      )
    )(item)

export const getPath =
  ({
    survey,
    lang,
    labelType = NodeDef.NodeDefLabelTypes.label,
  }: {
    survey: ArenaSurvey
    lang: string
    labelType?: NodeDef.NodeDefLabelType
  }): ItemGetter<string> =>
  (item) => {
    const keys = getKeysHierarchy(survey)(item)
    return NodeKeys.getKeysHierarchyPath({ survey, lang, includeRootKeys: true, labelType })(keys)
  }

export const getNodeContextUuid: ItemGetter<string> = A.ifElse(
  isValidationCount,
  getNodeUuid, // Node has a validation count, the context will be the node itself (an entity)
  A.pipe(
    // Node is an attribute, the context node will be its parent entity (it's the last item of the hierarchy)
    A.prop(keys.keysHierarchy),
    A.last,
    A.prop(NodeKeys.keys.nodeUuid)
  )
)

export const getNodeDefContextUuid: ItemGetter<string> = A.ifElse(
  isValidationCount,
  getValidationCountChildDefUuid,
  getNodeDefUuid
)
export const getValidation = getProp<Validation>(keys.validation)
export const { getStep } = Record
export const { getOwnerUuid } = Record
