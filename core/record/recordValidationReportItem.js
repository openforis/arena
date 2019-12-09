import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as NodeKeys from '@core/record/nodeKeys'
import * as ObjectUtils from '@core/objectUtils'

const keys = {
  recordUuid: 'recordUuid',
  recordStep: 'recordStep',
  recordOwnerUuid: 'recordOwnerUuid',
  nodeUuid: 'nodeUuid',
  nodeDefUuid: 'nodeDefUuid',
  keysHierarchy: 'keysHierarchy',
  keysSelf: 'keysSelf',
  validation: 'validation',
  validationCount: 'validationCount',
  validationCountChildUuid: 'validationCountChildUuid',
}

export const getRecordUuid = R.prop(keys.recordUuid)
export const getRecordStep = R.prop(keys.recordStep)
export const getRecordOwnerUuid = R.prop(keys.recordOwnerUuid)
const getNodeUuid = R.prop(keys.nodeUuid)
const getNodeDefUuid = R.prop(keys.nodeDefUuid)
const getKeysSelf = R.propOr({}, keys.keysSelf)
const getValidationCount = R.prop(keys.validationCount)
const getValidationCountChildUuid = R.prop(keys.validationCountChildUuid)

const isValidationCount = R.pipe(getValidationCount, R.isNil, R.not)

const getNodeDef = survey => item => Survey.getNodeDefByUuid(getNodeDefUuid(item))(survey)

const getKeysHierarchy = survey => item =>
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
        nodeDefUuid: getValidationCountChildUuid(item),
      }),
    ),
  )(item)

export const getPath = (survey, lang) => item =>
  R.pipe(getKeysHierarchy(survey), NodeKeys.getKeysHierarchyPath(survey, lang))(item)

export const getNodeContextUuid = item =>
  isValidationCount(item)
    ? getNodeUuid(item) // Node is an entity
    : R.prop(NodeKeys.keys.nodeUuid, R.last(item.keysHierarchy)) // Node is an attribute, its parent is the last item of its hierarchy

export const getNodeDefContextUuid = R.ifElse(isValidationCount, getValidationCountChildUuid, getNodeDefUuid)

export const getValidation = item => R.pipe(getValidationCount, R.defaultTo(R.prop(keys.validation, item)))(item)

export const getStep = Record.getStep
export const getOwnerUuid = Record.getOwnerUuid
