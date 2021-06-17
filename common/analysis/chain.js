import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'

import * as ObjectUtils from '@core/objectUtils'
import * as DateUtils from '@core/dateUtils'
import * as Validation from '@core/validation/validation'

export const keys = {
  dateCreated: ObjectUtils.keys.dateCreated,
  dateExecuted: 'dateExecuted',
  dateModified: ObjectUtils.keys.dateModified,
  props: ObjectUtils.keys.props,
  statusExec: 'status_exec',
  uuid: ObjectUtils.keys.uuid,
  temporary: ObjectUtils.keys.temporary,
  validation: ObjectUtils.keys.validation,
  scriptCommon: 'script_common',
  chainNodeDefs: 'chain_node_defs',
}

export const keysProps = {
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
  cycles: ObjectUtils.keysProps.cycles,
}

export const statusExec = {
  error: 'error',
  success: 'success',
  running: 'running',
}

// ====== READ

export const {
  getUuid,
  getProps,
  getPropsDiff,
  getCycles,
  getDateCreated,
  getDateModified,
  getDescriptions,
  getDescription,
  getLabels,
  getLabel,
  isTemporary,
} = ObjectUtils
export const getDateExecuted = ObjectUtils.getDate(keys.dateExecuted)
export const getStatusExec = R.propOr(null, keys.statusExec)
export const getScriptCommon = R.propOr(null, keys.scriptCommon)

// ===== READ - chainNodeDef
export const getChainNodeDefs = (chain) => chain?.[keys.chainNodeDefs] || []

export const getChainNodeDefsInEntity =
  ({ entity }) =>
  (chain) => {
    const chainNodeDefsWithNodeDef = getChainNodeDefs(chain)
    const chainNodeDefsInEntity = (chainNodeDefsWithNodeDef || []).filter(
      (chainNodeDef) =>
        NodeDef.getParentUuid(chainNodeDef) === NodeDef.getUuid(entity) &&
        NodeDef.getChainUuid(chainNodeDef) === getUuid(chain)
    )
    return chainNodeDefsInEntity
  }

export const getColumnsNamesWithNodeDefsInEntity =
  ({ entity }) =>
  (chain) => {
    const chainNodeDefsInEntity = getChainNodeDefsInEntity({ entity })(chain)

    const columnsNamesWithNodeDefs = chainNodeDefsInEntity.flatMap((nodeDef) => {
      const name = NodeDef.getName(nodeDef)
      if (NodeDef.isCode(nodeDef)) {
        return [
          {
            columnName: `${name}_code`,
            nodeDef,
          },
          { columnName: `${name}_label`, nodeDef },
        ]
      }
      return { columnName: name, nodeDef }
    })
    return columnsNamesWithNodeDefs
  }

export const getColumnsNamesInEntity =
  ({ entity }) =>
  (chain) => {
    const columnsNamesWithNodeDefs = getColumnsNamesWithNodeDefsInEntity({ entity })(chain)
    const columnsNames = columnsNamesWithNodeDefs.map(({ columnName }) => columnName)
    return columnsNames
  }

export const getNodeDefsByColumnNameInEntity =
  ({ entity }) =>
  (chain) => {
    const columnsNamesWithNodeDefs = getColumnsNamesWithNodeDefsInEntity({ entity })(chain)
    const nodeDefsByColumnName = columnsNamesWithNodeDefs.reduce(
      (nodeDefs, { columnName, nodeDef }) => ({ ...nodeDefs, [columnName]: nodeDef }),
      {}
    )

    return nodeDefsByColumnName
  }

// ====== CHECK

export const isDraft = R.ifElse(R.pipe(getDateExecuted, R.isNil), R.always(true), (chain) =>
  DateUtils.isAfter(getDateModified(chain), getDateExecuted(chain))
)

// ====== VALIDATION
// The validation object contains the validation of chain index by uuids
export const { getValidation } = Validation
export const { hasValidation } = Validation
export const { assocValidation } = Validation
export const { dissocValidation } = Validation

export const getItemValidationByUuid = (uuid) => R.pipe(getValidation, Validation.getFieldValidation(uuid))
export const assocItemValidation = (uuid, validation) => (chain) =>
  R.pipe(getValidation, Validation.assocFieldValidation(uuid, validation), (validationUpdated) =>
    Validation.assocValidation(validationUpdated)(chain)
  )(chain)
