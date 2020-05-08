import './components/chainView.scss'
import './components/chainList.scss'
import './components/chainListItem.scss'
import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { useOnUpdate, useI18n, useSurveyInfo, useOnSurveyCycleUpdate } from '@webapp/commonComponents/hooks'
import LabelsEditor from '@webapp/loggedin/surveyViews/labelsEditor/labelsEditor'
import CyclesSelect from '@webapp/loggedin/surveyViews/cyclesSelect/cyclesSelect'

import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'

import {
  fetchChain,
  navigateToChainsView,
  openRChain,
  resetChain,
  updateChainCycles,
  updateChainProp,
  validateChain,
} from '@webapp/loggedin/modules/analysis/chain/actions'

import StepList from './components/stepList'
import ButtonBar from './components/buttonBar'

const ChainView = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const { chainUuid } = useParams()
  const chain = useSelector(ChainState.getProcessingChain)
  const editingStep = useSelector(StepState.isEditingStep)

  useEffect(() => {
    if (R.isEmpty(chain)) {
      dispatch(fetchChain(chainUuid))
    }

    return () => {
      // Reset state on unmount (Only if not navigating to node def edit from calculation editor)
      if (
        R.pipe(R.path(['location', 'pathname']), R.startsWith(appModuleUri(analysisModules.nodeDef)), R.not)(history)
      ) {
        dispatch(resetChain())
      }
    }
  }, [])

  useOnSurveyCycleUpdate(() => navigateToChainsView(history))

  useOnUpdate(() => {
    if (!editingStep) {
      // Validate chain on step editor close
      dispatch(validateChain())
    }
  }, [editingStep])

  const validation = Chain.getItemValidationByUuid(Chain.getUuid(chain))(chain)

  return R.isEmpty(chain) ? null : (
    <div className={`chain${editingStep ? ' step-editor-open' : ''}`}>
      <button
        type="button"
        className="btn btn-s"
        style={{ position: 'absolute', right: '0' }}
        onClick={() => dispatch(openRChain(history))}
      >
        {i18n.t('analysisView.processingChainView.openChain')}
      </button>
      <div className="form">
        <LabelsEditor
          languages={Survey.getLanguages(surveyInfo)}
          labels={Chain.getLabels(chain)}
          formLabelKey="processingChainView.formLabel"
          readOnly={editingStep}
          validation={Validation.getFieldValidation(Chain.keysProps.labels)(validation)}
          onChange={(labels) => dispatch(updateChainProp(Chain.keysProps.labels, labels))}
        />

        {!editingStep && (
          <>
            <LabelsEditor
              formLabelKey="common.description"
              languages={Survey.getLanguages(surveyInfo)}
              labels={Chain.getDescriptions(chain)}
              onChange={(descriptions) => dispatch(updateChainProp(Chain.keysProps.descriptions, descriptions))}
            />
            <CyclesSelect
              cyclesKeysSelected={Chain.getCycles(chain)}
              onChange={(cycles) => dispatch(updateChainCycles(cycles))}
            />
          </>
        )}

        <StepList />
      </div>

      <ButtonBar />
    </div>
  )
}

export default ChainView
