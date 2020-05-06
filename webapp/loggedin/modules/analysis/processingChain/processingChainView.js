import './processingChainView.scss'

import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as ProcessingChain from '@common/analysis/processingChain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import { useOnUpdate, useI18n, useSurveyInfo, useSurveyCycleKey } from '@webapp/commonComponents/hooks'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'
import CyclesSelect from '@webapp/loggedin/surveyViews/cyclesSelect/cyclesSelect'
import ProcessingChainSteps from '@webapp/loggedin/modules/analysis/processingChain/components/processingChainSteps'
import ProcessingChainButtonBar from '@webapp/loggedin/modules/analysis/processingChain/components/processingChainButtonBar'

import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import {
  fetchProcessingChain,
  navigateToProcessingChainsView,
  updateProcessingChainProp,
  updateProcessingChainCycles,
  validateProcessingChain,
  resetProcessingChainState,
  openProcessingChain,
} from '@webapp/loggedin/modules/analysis/processingChain/actions'

const ProcessingChainView = () => {
  const { processingChainUuid } = useParams()

  const surveyInfo = useSurveyInfo()
  const surveyCycleKey = useSurveyCycleKey()
  const processingChain = useSelector(ProcessingChainState.getProcessingChain)
  const editingStep = useSelector(ProcessingStepState.isEditingStep)

  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  useEffect(() => {
    if (R.isEmpty(processingChain)) {
      dispatch(fetchProcessingChain(processingChainUuid))
    }

    return () => {
      // Reset state on unmount (Only if not navigating to node def edit from calculation editor)
      if (
        R.pipe(R.path(['location', 'pathname']), R.startsWith(appModuleUri(analysisModules.nodeDef)), R.not)(history)
      ) {
        dispatch(resetProcessingChainState())
      }
    }
  }, [])

  useOnUpdate(() => {
    dispatch(navigateToProcessingChainsView(history))
  }, [surveyCycleKey])

  useOnUpdate(() => {
    if (!editingStep) {
      // Validate chain on step editor close
      dispatch(validateProcessingChain())
    }
  }, [editingStep])

  const validation = ProcessingChain.getItemValidationByUuid(ProcessingChain.getUuid(processingChain))(processingChain)

  return R.isEmpty(processingChain) ? null : (
    <div className={`processing-chain${editingStep ? ' step-editor-open' : ''}`}>
      <button
        type="button"
        className="btn btn-s"
        style={{ position: 'absolute', right: '0' }}
        onClick={() => dispatch(openProcessingChain(history))}
      >
        {i18n.t('analysisView.processingChainView.openChain')}
      </button>
      <div className="form">
        <LabelsEditor
          languages={Survey.getLanguages(surveyInfo)}
          labels={ProcessingChain.getLabels(processingChain)}
          formLabelKey="processingChainView.formLabel"
          readOnly={editingStep}
          validation={Validation.getFieldValidation(ProcessingChain.keysProps.labels)(validation)}
          onChange={(labels) => dispatch(updateProcessingChainProp(ProcessingChain.keysProps.labels, labels))}
        />

        {!editingStep && (
          <>
            <LabelsEditor
              formLabelKey="common.description"
              languages={Survey.getLanguages(surveyInfo)}
              labels={ProcessingChain.getDescriptions(processingChain)}
              onChange={(descriptions) =>
                dispatch(updateProcessingChainProp(ProcessingChain.keysProps.descriptions, descriptions))
              }
            />
            <CyclesSelect
              cyclesKeysSelected={ProcessingChain.getCycles(processingChain)}
              onChange={(cycles) => dispatch(updateProcessingChainCycles(cycles))}
            />
          </>
        )}

        <ProcessingChainSteps
          processingChain={processingChain}
          validation={Validation.getFieldValidation(ProcessingChain.keys.processingSteps)(validation)}
        />
      </div>

      <ProcessingChainButtonBar />
    </div>
  )
}

export default ProcessingChainView
