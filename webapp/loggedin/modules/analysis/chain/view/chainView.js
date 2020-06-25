import './components/chainView.scss'
import './components/chainList.scss'
import './components/chainListItem.scss'
import './components/chainForm.scss'
import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import { useSurveyInfo } from '@webapp/store/survey'

import { useOnUpdate } from '@webapp/components/hooks'

import { useChainEdit } from '@webapp/loggedin/modules/analysis/hooks'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import StepView from '@webapp/loggedin/modules/analysis/step/view'
import ButtonRStudio from '@webapp/components/ButtonRStudio'

import {
  fetchChain,
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
  const surveyInfo = useSurveyInfo()
  const { chainUuid } = useParams()

  const { chain, editingStep, dirty } = useChainEdit()

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

  useOnUpdate(() => {
    if (!editingStep) {
      // Validate chain on step editor close
      dispatch(validateChain())
    }
  }, [editingStep])

  const validation = Chain.getItemValidationByUuid(Chain.getUuid(chain))(chain)

  if (R.isEmpty(chain)) return null

  return (
    <div className={`chain${editingStep ? ' show-step' : ''}`}>
      <ButtonRStudio onClick={() => dispatch(openRChain())} disabled={Survey.isDraft(surveyInfo) || dirty} />

      <div className="form">
        <LabelsEditor
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
              labels={Chain.getDescriptions(chain)}
              onChange={(descriptions) => dispatch(updateChainProp(Chain.keysProps.descriptions, descriptions))}
            />
            <CyclesSelector
              cyclesKeysSelected={Chain.getCycles(chain)}
              onChange={(cycles) => dispatch(updateChainCycles(cycles))}
            />
          </>
        )}

        <StepList />
      </div>

      <StepView />
      <ButtonBar />
    </div>
  )
}

export default ChainView
