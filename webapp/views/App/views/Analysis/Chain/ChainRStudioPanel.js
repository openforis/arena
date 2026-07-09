import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'
import { Accordion, Fieldset } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import ButtonRStudio from '@webapp/components/ButtonRStudio'

import RecordsDropdown from './RecordsDropdown'

export const ChainRStudioPanel = (props) => {
  const { updateChain } = props

  const dispatch = useDispatch()
  const chain = useChain()
  const editable = useChainEditable()
  const validation = Chain.getValidation(chain)

  const _openRStudio = useCallback(
    ({ isLocal = false } = {}) => dispatch(ChainActions.openRStudio({ isLocal })),
    [dispatch]
  )

  const openRStudio = useCallback(() => _openRStudio(), [_openRStudio])
  const openRStudioLocal = useCallback(() => _openRStudio({ isLocal: true }), [_openRStudio])

  return (
    <Accordion
      className="rstudio-accordion"
      items={[
        {
          key: 'rstudio',
          title: 'RStudio',
          content: (
            <div className="content">
              <div>
                <Checkbox
                  label="chainView.submitOnlyAnalysisStepDataIntoR"
                  checked={Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)}
                  validation={Validation.getFieldValidation(Chain.keysProps.submitOnlyAnalysisStepDataIntoR)(
                    validation
                  )}
                  onChange={(value) => updateChain(Chain.assocSubmitOnlyAnalysisStepDataIntoR(value)(chain))}
                  disabled={!editable}
                />
                <Checkbox
                  label="chainView.submitOnlySelectedRecordsIntoR"
                  checked={Chain.isSubmitOnlySelectedRecordsIntoR(chain)}
                  validation={Validation.getFieldValidation(Chain.keysProps.submitOnlySelectedRecordsIntoR)(validation)}
                  onChange={(value) => updateChain(Chain.assocSubmitOnlySelectedRecordsIntoR(value)(chain))}
                  disabled={!editable}
                />
                {Chain.isSubmitOnlySelectedRecordsIntoR(chain) && (
                  <RecordsDropdown
                    onChange={(selectedRecords) =>
                      updateChain(Chain.assocSelectedRecordUuids(selectedRecords.map(Record.getUuid))(chain))
                    }
                    selectedUuids={Chain.getSelectedRecordUuids(chain)}
                    disabled={!editable}
                  />
                )}
                <Checkbox
                  info="chainView.resultsBackFromRStudioInfo"
                  label="chainView.resultsBackFromRStudio"
                  checked={Chain.isResultsBackFromRStudio(chain)}
                  validation={Validation.getFieldValidation(Chain.keysProps.resultsBackFromRStudio)(validation)}
                  onChange={(value) => updateChain(Chain.assocResultsBackFromRStudio(value)(chain))}
                  disabled={!editable}
                />
              </div>
              <ButtonRStudio onClick={openRStudio} />
              <ButtonRStudio isLocal onClick={openRStudioLocal} />
            </div>
          ),
        },
      ]}
    />
  )
}

ChainRStudioPanel.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
