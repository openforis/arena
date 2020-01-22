import './processingStepView.scss'

import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router'
import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/commonComponents/hooks'
import EntitySelector from './components/entitySelector'
import ConfirmDialog from '@webapp/commonComponents/confirmDialog'
import ProcessingStepCalculationsList from './components/processingStepCalculationsList'
import ProcessingStepCalculationEditor from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationEditor'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import {
  fetchProcessingStepCalculations,
  resetProcessingStepState,
  updateProcessingStepProps,
  addEntityVirtual,
  editEntityVirtual,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

const ProcessingStepView = props => {
  const {
    processingStep,
    processingStepPrev,
    processingStepNext,
    processingStepEntity,
    processingStepCalculation,
    dirty,
    editingCalculation,
    fetchProcessingStepCalculations,
    resetProcessingStepState,
    updateProcessingStepProps,
    addEntityVirtual,
    editEntityVirtual,
  } = props

  const history = useHistory()

  const calculationEditorOpened = !R.isEmpty(processingStepCalculation)
  const hasCalculationSteps = R.pipe(ProcessingStep.getCalculationsCount, cnt => cnt > 0)(processingStep)
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
                <>
                  <button
                    className="btn btn-s btn-add"
                    onClick={() => addEntityVirtual(history)}
                    aria-disabled={hasCalculationSteps}
                  >
                    <span className="icon icon-plus icon-12px icon-left" />
                    {i18n.t('processingStepView.virtualEntity')}
                  </button>
                  <button
                    className="btn btn-s btn-edit"
                    onClick={() => editEntityVirtual(history)}
                    aria-disabled={
                      hasCalculationSteps || !processingStepEntity || !NodeDef.isVirtual(processingStepEntity)
                    }
                  >
                    <span className="icon icon-pencil2 icon-12px icon-left" />
                    {i18n.t('processingStepView.virtualEntity')}
                  </button>
                </>
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

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const processingStepEntity = R.pipe(ProcessingStep.getEntityUuid, entityDefUuid =>
    Survey.getNodeDefByUuid(entityDefUuid)(survey),
  )(processingStep)

  return {
    processingStep,
    processingStepPrev: ProcessingStepState.getProcessingStepPrev(state),
    processingStepNext: ProcessingStepState.getProcessingStepNext(state),
    processingStepEntity,
    dirty: ProcessingStepState.isDirty(state),
    processingStepCalculation: ProcessingStepCalculationState.getCalculation(state),
    editingCalculation: ProcessingStepCalculationState.isEditingCalculation(state),
  }
}

export default connect(mapStateToProps, {
  fetchProcessingStepCalculations,
  resetProcessingStepState,
  updateProcessingStepProps,
  addEntityVirtual,
  editEntityVirtual,
})(ProcessingStepView)
