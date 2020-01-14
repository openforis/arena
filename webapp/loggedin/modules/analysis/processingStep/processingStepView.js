import './processingStepView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { useParams } from 'react-router'
import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'

import { appModuleUri, analysisModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/commonComponents/hooks'
import EntitySelector from './components/entitySelector'
import ProcessingStepCalculationsList from './components/processingStepCalculationsList'
import ProcessingStepCalculationEditor from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationEditor'
import NodeDefView from '@webapp/loggedin/surveyViews/nodeDef/nodeDefView'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import {
  fetchProcessingStep,
  resetProcessingStepState,
  putProcessingStepProps,
  deleteProcessingStep,
  addEntityVirtual,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

const ProcessingStepView = props => {
  const {
    history,
    processingStep,
    processingStepPrev,
    processingStepNext,
    processingStepCalculation,
    fetchProcessingStep,
    resetProcessingStepState,
    putProcessingStepProps,
    deleteProcessingStep,
    addEntityVirtual,
  } = props
  const { processingStepUuid, nodeDefUuid } = useParams()

  // Reset state on unmount (Only if not navigating to node def edit from calculation editor)
  const onUnmount = () => {
    if (R.pipe(R.path(['location', 'pathname']), R.startsWith(appModuleUri(analysisModules.nodeDef)), R.not)(history)) {
      resetProcessingStepState()
    }
  }

  useEffect(() => {
    if (processingStepUuid && R.isEmpty(processingStep)) {
      fetchProcessingStep(processingStepUuid)
      return onUnmount
    }
  }, [])

  const calculationEditorOpened = Boolean(processingStepCalculation)

  const hasCalculationSteps = !R.isEmpty(ProcessingStep.getCalculationSteps(processingStep))

  const i18n = useI18n()

  return nodeDefUuid ? (
    <NodeDefView />
  ) : R.isEmpty(processingStep) ? null : (
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
          readOnly={hasCalculationSteps || calculationEditorOpened}
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

        {!processingStepNext && !calculationEditorOpened && (
          <div className="button-bar">
            <button
              className="btn-s btn-danger btn-delete"
              onClick={() =>
                window.confirm(i18n.t('processingStepView.deleteConfirm')) && deleteProcessingStep(history)
              }
            >
              <span className="icon icon-bin icon-12px icon-left" />
              {i18n.t('common.delete')}
            </button>
          </div>
        )}
      </div>

      <ProcessingStepCalculationEditor />
    </div>
  )
}

const mapStateToProps = state => ({
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
  addEntityVirtual,
})(ProcessingStepView)
