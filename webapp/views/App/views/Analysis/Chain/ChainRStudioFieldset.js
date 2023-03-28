import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { FormItem } from '@webapp/components/form/Input'
import { Checkbox } from '@webapp/components/form'
import ButtonRStudio from '@webapp/components/ButtonRStudio'
import { useI18n } from '@webapp/store/system'

export const ChainRStudioFieldset = (props) => {
  const { updateChain } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
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
        <FormItem label={i18n.t('chainView.submitOnlyAnalysisStepDataIntoR')}>
          <Checkbox
            checked={Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)}
            validation={Validation.getFieldValidation(Chain.keysProps.submitOnlyAnalysisStepDataIntoR)(validation)}
            onChange={(value) => updateChain(Chain.assocSubmitOnlyAnalysisStepDataIntoR(value)(chain))}
          />
        </FormItem>
        <FormItem label={i18n.t('chainView.resultsBackFromRStudio')}>
          <Checkbox
            checked={Chain.isResultsBackFromRStudio(chain)}
            validation={Validation.getFieldValidation(Chain.keysProps.resultsBackFromRStudio)(validation)}
            onChange={(value) => updateChain(Chain.assocResultsBackFromRStudio(value)(chain))}
          />
        </FormItem>
        <ButtonRStudio onClick={openRStudio} />
        <ButtonRStudio isLocal onClick={openRStudioLocal} />
      </div>
    </fieldset>
  )
}
