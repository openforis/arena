import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as NodeKeys from '@core/record/nodeKeys'

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
}

export const getRecordCycle = A.prop(keys.recordCycle)
export const getRecordStep = A.prop(keys.recordStep)
export const getRecordDateCreated = A.prop(keys.recordDateCreated)
export const getRecordDateModified = A.prop(keys.recordDateModified)
export const getRecordOwnerName = A.prop(keys.recordOwnerName)
export const getRecordOwnerUuid = A.prop(keys.recordOwnerUuid)
export const getRecordUuid = A.prop(keys.recordUuid)
const getNodeUuid = A.prop(keys.nodeUuid)
const getNodeDefUuid = A.prop(keys.nodeDefUuid)
const getValidationCountChildDefUuid = A.prop(keys.validationCountChildDefUuid)
const getKeysSelf = A.propOr({}, keys.keysSelf)

const isValidationCount = A.pipe(getValidationCountChildDefUuid, A.isNil, A.not)

export const getNodeDef = (survey) => (item) => Survey.getNodeDefByUuid(getNodeDefUuid(item))(survey)

const getKeysHierarchy = (survey) => (item) =>
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
  ({ survey, lang, labelType = NodeDef.NodeDefLabelTypes.label }) =>
  (item) => {
    const keys = getKeysHierarchy(survey)(item)
    return NodeKeys.getKeysHierarchyPath({ survey, lang, includeRootKeys: true, labelType })(keys)
  }

export const getNodeContextUuid = A.ifElse(
  isValidationCount,
  getNodeUuid, // Node has a validation count, the context will be the node itself (an entity)
  A.pipe(
    // Node is an attribute, the context node will be its parent entity (it's the last item of the hierarchy)
    A.prop(keys.keysHierarchy),
    A.last,
    A.prop(NodeKeys.keys.nodeUuid)
  )
)

export const getNodeDefContextUuid = A.ifElse(isValidationCount, getValidationCountChildDefUuid, getNodeDefUuid)
export const getValidation = A.prop(keys.validation)
export const { getStep } = Record
export const { getOwnerUuid } = Record
