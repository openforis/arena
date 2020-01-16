import './processingStepView.scss'

import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router'
import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'

import { useI18n } from '@webapp/commonComponents/hooks'
import EntitySelector from './components/entitySelector'
import ProcessingStepCalculationsList from './components/processingStepCalculationsList'
import ProcessingStepCalculationEditor from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationEditor'
import ConfirmDialog from '@webapp/commonComponents/confirmDialog'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import {
  fetchProcessingStepCalculations,
  resetProcessingStepState,
  updateProcessingStepProps,
  addEntityVirtual,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

const ProcessingStepView = props => {
  const {
    processingStep,
    processingStepPrev,
    processingStepNext,
    processingStepCalculation,
    dirty,
    editingCalculation,
    fetchProcessingStepCalculations,
    resetProcessingStepState,
    updateProcessingStepProps,
    addEntityVirtual,
  } = props

  const history = useHistory()

  const calculationEditorOpened = !R.isEmpty(processingStepCalculation)
  const hasCalculationSteps = R.pipe(ProcessingStep.getCalculationsCount, cnt => cnt > 0)(processingStep)
  const calculationSteps = ProcessingStep.getCalculations(processingStep)
  const canUpdateEntity = hasCalculationSteps || calculationEditorOpened || Boolean(processingStepNext)

  const i18n = useI18n()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    if (!editingCalculation) {
      fetchProcessingStepCalculations()
    }
  }, [ProcessingStep.getUuid(processingStep)])

  return (
    <div className={`processing-step${calculationEditorOpened ? ' calculation-editor-opened' : ''}`}>
      <div className="form">
        {!editingCalculation && (
          <>
            <button
              className="btn-s btn-close"
              onClick={() => {
                if (dirty) {
                  setShowCancelConfirm(true)
                } else {
                  resetProcessingStepState()
                }
              }}
            >
              <span className="icon icon-10px icon-cross" />
            </button>

            <EntitySelector
              processingStep={processingStep}
              processingStepPrev={processingStepPrev}
              showLabel={!calculationEditorOpened}
              onChange={entityUuid => {
                const props = {
                  [ProcessingStep.keysProps.entityUuid]: entityUuid,
                  [ProcessingStep.keysProps.categoryUuid]: null,
                }
                updateProcessingStepProps(props)
              }}
              readOnly={canUpdateEntity}
            >
              {!calculationEditorOpened && (
                <button
                  className="btn btn-s btn-add"
                  onClick={() => addEntityVirtual(history)}
                  aria-disabled={hasCalculationSteps}
                >
                  <span className="icon icon-plus icon-12px icon-left" />
                  {i18n.t('processingStepView.virtualEntity')}
                </button>
              )}
            </EntitySelector>
          </>
        )}
        <ProcessingStepCalculationsList
          processingStep={processingStep}
          calculationEditorOpened={calculationEditorOpened}
        />
      </div>

      <ProcessingStepCalculationEditor />

      {showCancelConfirm && (
        <ConfirmDialog
          message={i18n.t('common.cancelConfirm')}
          onOk={() => {
            setShowCancelConfirm(false)
            resetProcessingStepState()
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  )
}

const mapStateToProps = state => ({
  processingStep: ProcessingStepState.getProcessingStep(state),
  processingStepPrev: ProcessingStepState.getProcessingStepPrev(state),
  processingStepNext: ProcessingStepState.getProcessingStepNext(state),
  dirty: ProcessingStepState.isDirty(state),
  processingStepCalculation: ProcessingStepCalculationState.getCalculation(state),
  editingCalculation: ProcessingStepCalculationState.isEditingCalculation(state),
})

export default connect(mapStateToProps, {
  fetchProcessingStepCalculations,
  resetProcessingStepState,
  updateProcessingStepProps,
  addEntityVirtual,
})(ProcessingStepView)
