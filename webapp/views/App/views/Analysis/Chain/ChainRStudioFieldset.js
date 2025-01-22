import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { ChainActions, useChain, useChainRecordsCountByStep } from '@webapp/store/ui/chain'
import { Checkbox } from '@webapp/components/form'
import ButtonRStudio from '@webapp/components/ButtonRStudio'
import RecordsDropdown from './RecordsDropdown'

export const ChainRStudioFieldset = (props) => {
  const { updateChain } = props

  const dispatch = useDispatch()
  const chain = useChain()
  const validation = Chain.getValidation(chain)

  const recordsCountByStep = useChainRecordsCountByStep()
  const analysisRecordsAvailable = Number(recordsCountByStep[RecordStep.analysisCode]) > 0

  const _openRStudio = useCallback(({ isLocal = false }) => dispatch(ChainActions.openRStudio({ isLocal })), [dispatch])

  const openRStudio = useCallback(() => _openRStudio(), [_openRStudio])
  const openRStudioLocal = useCallback(() => _openRStudio({ isLocal: true }), [_openRStudio])

  return (
    <fieldset className="rstudio-fieldset">
      <legend>RStudio</legend>
      <div className="content">
        <div>
          {analysisRecordsAvailable && (
            <Checkbox
              label="chainView.submitOnlyAnalysisStepDataIntoR"
              checked={Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)}
              validation={Validation.getFieldValidation(Chain.keysProps.submitOnlyAnalysisStepDataIntoR)(validation)}
              onChange={(value) => updateChain(Chain.assocSubmitOnlyAnalysisStepDataIntoR(value)(chain))}
            />
          )}
          <Checkbox
            label="chainView.submitOnlySelectedRecordsIntoR"
            checked={Chain.isSubmitOnlySelectedRecordsIntoR(chain)}
            validation={Validation.getFieldValidation(Chain.keysProps.submitOnlySelectedRecordsIntoR)(validation)}
            onChange={(value) => updateChain(Chain.assocSubmitOnlySelectedRecordsIntoR(value)(chain))}
          />
          {Chain.isSubmitOnlySelectedRecordsIntoR(chain) && (
            <RecordsDropdown
              onChange={(selectedRecords) =>
                updateChain(Chain.assocSelectedRecordUuids(selectedRecords.map(Record.getUuid))(chain))
              }
              selectedUuids={Chain.getSelectedRecordUuids(chain)}
            />
          )}
          <Checkbox
            label="chainView.resultsBackFromRStudio"
            checked={Chain.isResultsBackFromRStudio(chain)}
            validation={Validation.getFieldValidation(Chain.keysProps.resultsBackFromRStudio)(validation)}
            onChange={(value) => updateChain(Chain.assocResultsBackFromRStudio(value)(chain))}
          />
        </div>
        <ButtonRStudio onClick={openRStudio} />
        <ButtonRStudio isLocal onClick={openRStudioLocal} />
      </div>
    </fieldset>
  )
}

ChainRStudioFieldset.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
