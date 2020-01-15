import './processingStepView.scss'

import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { useHistory, useParams } from 'react-router'
import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'

import { useI18n } from '@webapp/commonComponents/hooks'
import EntitySelector from './components/entitySelector'
import ProcessingStepCalculationsList from './components/processingStepCalculationsList'
import ProcessingStepCalculationEditor from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationEditor'
import NodeDefView from '@webapp/loggedin/surveyViews/nodeDef/nodeDefView'
import ConfirmDialog from '@webapp/commonComponents/confirmDialog'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import {
  resetProcessingStepState,
  putProcessingStepProps,
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
    resetProcessingStepState,
    putProcessingStepProps,
    addEntityVirtual,
  } = props

  const history = useHistory()
  const { nodeDefUuid } = useParams()

  const calculationEditorOpened = Boolean(processingStepCalculation)

  const hasCalculationSteps = !R.isEmpty(ProcessingStep.getCalculationSteps(processingStep))

  const i18n = useI18n()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  return nodeDefUuid ? (
    <NodeDefView />
  ) : R.isEmpty(processingStep) ? null : (
    <div className={`processing-step${calculationEditorOpened ? ' calculation-editor-opened' : ''}`}>
      <div className="form">
        {!editingCalculation && (
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
        )}

        <EntitySelector
          processingStep={processingStep}
          processingStepPrev={processingStepPrev}
          showLabel={!calculationEditorOpened}
          onChange={entityUuid => {
            const props = {
              [ProcessingStep.keysProps.entityUuid]: entityUuid,
              [ProcessingStep.keysProps.categoryUuid]: null,
            }
            putProcessingStepProps(props)
          }}
          readOnly={hasCalculationSteps || calculationEditorOpened || Boolean(processingStepNext)}
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
  processingStepCalculation: ProcessingStepState.getProcessingStepCalculationForEdit(state),
  dirty: ProcessingStepState.isDirty(state),
  editingCalculation: ProcessingStepCalculationState.isEditingCalculation(state),
})

export default connect(mapStateToProps, {
  resetProcessingStepState,
  putProcessingStepProps,
  addEntityVirtual,
})(ProcessingStepView)
