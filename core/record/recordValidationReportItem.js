import * as R from 'ramda'

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

export const getRecordCycle = R.prop(keys.recordCycle)
export const getRecordStep = R.prop(keys.recordStep)
export const getRecordDateCreated = R.prop(keys.recordDateCreated)
export const getRecordDateModified = R.prop(keys.recordDateModified)
export const getRecordOwnerName = R.prop(keys.recordOwnerName)
export const getRecordOwnerUuid = R.prop(keys.recordOwnerUuid)
export const getRecordUuid = R.prop(keys.recordUuid)
const getNodeUuid = R.prop(keys.nodeUuid)
const getNodeDefUuid = R.prop(keys.nodeDefUuid)
const getValidationCountChildDefUuid = R.prop(keys.validationCountChildDefUuid)
const getKeysSelf = R.propOr({}, keys.keysSelf)

const isValidationCount = R.pipe(getValidationCountChildDefUuid, R.isNil, R.not)

const getNodeDef = (survey) => (item) => Survey.getNodeDefByUuid(getNodeDefUuid(item))(survey)

const getKeysHierarchy = (survey) => (item) =>
  R.pipe(
    R.prop(keys.keysHierarchy),
    // If item nodeDef is root, esclude the first item of the hieerarchy (it would be null)
    R.when(R.always(NodeDef.isRoot(getNodeDef(survey)(item))), R.tail),
    // Append node itself to the hierarchy
    R.append({
      keys: getKeysSelf(item),
      nodeDefUuid: getNodeDefUuid(item),
    }),
    // Append validation count child node def to the hierarchy, if any
    R.when(
      R.always(isValidationCount(item)),
      R.append({
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

export const getNodeContextUuid = R.ifElse(
  isValidationCount,
  getNodeUuid, // Node has a validation count, the context will be the node itself (an entity)
  R.pipe(
    // Node is an attribute, the context node will be its parent entity (it's the last item of the hierarchy)
    R.prop(keys.keysHierarchy),
    R.last,
    R.prop(NodeKeys.keys.nodeUuid)
  )
)

export const getNodeDefContextUuid = R.ifElse(isValidationCount, getValidationCountChildDefUuid, getNodeDefUuid)
export const getValidation = R.prop(keys.validation)
export const { getStep } = Record
export const { getOwnerUuid } = Record
