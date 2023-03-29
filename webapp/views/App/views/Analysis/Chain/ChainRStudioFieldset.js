import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { Checkbox } from '@webapp/components/form'
import ButtonRStudio from '@webapp/components/ButtonRStudio'

export const ChainRStudioFieldset = (props) => {
  const { updateChain } = props

  const dispatch = useDispatch()
  const chain = useChain()
  const validation = Chain.getValidation(chain)

  const openRStudio = useCallback(() => {
    dispatch(ChainActions.openRStudio())
  }, [])

  const openRStudioLocal = useCallback(() => {
    dispatch(ChainActions.openRStudio({ isLocal: true }))
  }, [])

  return (
    <fieldset className="rstudio-fieldset">
      <legend>RStudio</legend>
      <div className="content">
        <Checkbox
          label="chainView.submitOnlyAnalysisStepDataIntoR"
          checked={Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)}
          validation={Validation.getFieldValidation(Chain.keysProps.submitOnlyAnalysisStepDataIntoR)(validation)}
          onChange={(value) => updateChain(Chain.assocSubmitOnlyAnalysisStepDataIntoR(value)(chain))}
        />
        <Checkbox
          label="chainView.resultsBackFromRStudio"
          checked={Chain.isResultsBackFromRStudio(chain)}
          validation={Validation.getFieldValidation(Chain.keysProps.resultsBackFromRStudio)(validation)}
          onChange={(value) => updateChain(Chain.assocResultsBackFromRStudio(value)(chain))}
        />
        <ButtonRStudio onClick={openRStudio} />
        <ButtonRStudio isLocal onClick={openRStudioLocal} />
      </div>
    </fieldset>
  )
}
