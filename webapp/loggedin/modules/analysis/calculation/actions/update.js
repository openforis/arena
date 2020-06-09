import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/processingChain'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as ChainValidator from '@common/analysis/processingChainValidator'

import { SurveyState } from '@webapp/store/survey'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as CalculationState from '@webapp/loggedin/modules/analysis/calculation/state'

import { chainValidationUpdate } from '@webapp/loggedin/modules/analysis/chain/actions'

export const calculationDirtyUpdate = 'analysis/calculation/dirty/update'

const _updateCalculationDirty = (calculation) => async (dispatch, getState) => {
  dispatch({ type: calculationDirtyUpdate, calculation })

  // Validate calculation and update validation in chain
  const state = getState()
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const chain = ChainState.getProcessingChain(state)
  const calculationValidation = await ChainValidator.validateCalculation(
    calculation,
    Survey.getDefaultLanguage(surveyInfo)
  )
  const chainUpdated = Chain.assocItemValidation(Calculation.getUuid(calculation), calculationValidation)(chain)

  dispatch({ type: chainValidationUpdate, validation: Chain.getValidation(chainUpdated) })
}

export const updateCalculationProp = (prop, value) => async (dispatch, getState) => {
  const calculation = CalculationState.getCalculation(getState())

  const calculationUpdated = R.pipe(
    Calculation.assocProp(prop, value),
    // When changing type, reset nodeDef
    R.when(
      R.always(R.equals(prop, Calculation.keysProps.type)),
      R.pipe(
        Calculation.assocNodeDefUuid(null),
        // When type is categorical, reset aggregate function
        R.when(
          R.always(R.equals(value, Calculation.type.categorical)),
          Calculation.assocProp(Calculation.keysProps.aggregateFn, null)
        )
      )
    )
  )(calculation)

  dispatch(_updateCalculationDirty(calculationUpdated))
}

export const updateCalculationAttribute = (attrDef) => async (dispatch, getState) => {
  const calculation = CalculationState.getCalculation(getState())
  const calculationUpdated = Calculation.assocNodeDefUuid(NodeDef.getUuid(attrDef))(calculation)
  dispatch(_updateCalculationDirty(calculationUpdated))
}

// ==== validation
export const validateCalculation = () => (dispatch, getState) => {
  const calculation = CalculationState.getCalculation(getState())
  dispatch(_updateCalculationDirty(calculation))
}
