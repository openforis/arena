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
  resetProcessingStepState,
  putProcessingStepProps,
  addEntityVirtual,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

const ProcessingStepView = props => {
  const {
    history,
    processingStep,
    processingStepPrev,
    processingStepCalculation,
    resetProcessingStepState,
    putProcessingStepProps,
    addEntityVirtual,
  } = props
  const { nodeDefUuid } = useParams()

  useEffect(() => {
    // Reset state on unmount (Only if not navigating to node def edit from calculation editor)
    return () => {
      if (
        R.pipe(R.path(['location', 'pathname']), R.startsWith(appModuleUri(analysisModules.nodeDef)), R.not)(history)
      ) {
        resetProcessingStepState()
      }
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
      </div>

      <ProcessingStepCalculationEditor />
    </div>
  )
}

const mapStateToProps = state => ({
  processingStep: ProcessingStepState.getProcessingStep(state),
  processingStepPrev: ProcessingStepState.getProcessingStepPrev(state),
  processingStepCalculation: ProcessingStepState.getProcessingStepCalculationForEdit(state),
})

export default connect(mapStateToProps, {
  resetProcessingStepState,
  putProcessingStepProps,
  addEntityVirtual,
})(ProcessingStepView)
