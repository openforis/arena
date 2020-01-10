import './processingStepView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'
import { getUrlParam } from '@webapp/utils/routerUtils'

import { useI18n } from '@webapp/commonComponents/hooks'
import EntitySelector from './components/entitySelector'
import ProcessingStepCalculationsList from './components/processingStepCalculationsList'
import ProcessingStepCalculationEditor from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationEditor'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import {
  fetchProcessingStep,
  resetProcessingStepState,
  putProcessingStepProps,
  deleteProcessingStep,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

const ProcessingStepView = props => {
  const {
    history,
    processingStepUuid,
    processingStep,
    processingStepPrev,
    processingStepNext,
    processingStepCalculation,
    fetchProcessingStep,
    resetProcessingStepState,
    putProcessingStepProps,
    deleteProcessingStep,
  } = props

  useEffect(() => {
    fetchProcessingStep(processingStepUuid)

    return () => {
      resetProcessingStepState()
    }
  }, [])

  const calculationEditorOpened = Boolean(processingStepCalculation)

  const i18n = useI18n()

  return R.isEmpty(processingStep) ? null : (
    <div className={`processing-step${calculationEditorOpened ? ' calculation-editor-opened' : ''}`}>
      <div className="form">
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
          readOnly={!R.isEmpty(ProcessingStep.getCalculationSteps(processingStep) || calculationEditorOpened)}
        />

        <ProcessingStepCalculationsList
          processingStep={processingStep}
          calculationEditorOpened={calculationEditorOpened}
        />

        {!processingStepNext && !calculationEditorOpened && (
          <button
            className="btn-s btn-danger btn-delete"
            onClick={() => window.confirm(i18n.t('processingStepView.deleteConfirm')) && deleteProcessingStep(history)}
          >
            <span className="icon icon-bin icon-12px icon-left" />
            {i18n.t('common.delete')}
          </button>
        )}
      </div>

      <ProcessingStepCalculationEditor />
    </div>
  )
}

const mapStateToProps = (state, { match }) => ({
  processingStepUuid: getUrlParam('processingStepUuid')(match),
  processingStep: ProcessingStepState.getProcessingStep(state),
  processingStepNext: ProcessingStepState.getProcessingStepNext(state),
  processingStepPrev: ProcessingStepState.getProcessingStepPrev(state),
  processingStepCalculation: ProcessingStepState.getProcessingStepCalculationForEdit(state),
})

export default connect(mapStateToProps, {
  fetchProcessingStep,
  resetProcessingStepState,
  putProcessingStepProps,
  deleteProcessingStep,
})(ProcessingStepView)
