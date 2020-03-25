import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

export const colNames = {
  parentUuid: 'parent_uuid',
}

const keys = {
  step: 'step',
  nodeDefColumns: 'nodeDefColumns',
}

// ===== CREATE

export const newResultStepView = (step, calculations, nodeDefColumns) => ({
  step,
  calculations,
  nodeDefColumns,
})

// ===== READ

export const getStep = R.prop(keys.step)
export const getCalculations = R.propOr([], keys.calculations)
export const getNodeDefColumns = R.propOr([], keys.nodeDefColumns)

// ===== UTILS
export const getStepUuid = R.pipe(getStep, ProcessingStep.getUuid)
export const getViewName = R.pipe(getStepUuid, R.concat(`${SchemaRdb.resultTablePrefix}_`))
