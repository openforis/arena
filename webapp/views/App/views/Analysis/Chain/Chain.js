import './chain.scss'
import './chainList.scss'
import './chainListItem.scss'
import './chainForm.scss'

import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as Chain from '@common/analysis/processingChain'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurveyInfo } from '@webapp/store/survey'

import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import ButtonRStudio from '@webapp/components/ButtonRStudio'

import ButtonBar from './ButtonBar'

const ChainComponent = () => {
  const dispatch = useDispatch()
  const { chainUuid } = useParams()
  const surveyInfo = useSurveyInfo()
  const chain = useChain()
  const validation = Chain.getValidation(chain)

  const openRStudio = () => {} // TODO Actions.openRStudio({ state })}
  const updateChain = (chainUpdate) => dispatch(ChainActions.updateChain({ chain: chainUpdate }))

  useEffect(() => {
    dispatch(ChainActions.fetchChain({ chainUuid }))
  }, [])

  if (!chain) return null

  return (
    <>
      {/* <div className={`chain ${editingStep ? 'show-step' : ''}`}> */}
      <div className="chain">
        <ButtonRStudio onClick={openRStudio} disabled={Survey.isDraft(surveyInfo)} />

        <div className="form">
          <LabelsEditor
            labels={chain.props.labels}
            formLabelKey="processingChainView.formLabel"
            readOnly={false}
            validation={Validation.getFieldValidation(Chain.keysProps.labels)(validation)}
            onChange={(labels) => updateChain({ ...chain, props: { ...chain.props, labels } })}
          />

          <LabelsEditor
            formLabelKey="common.description"
            labels={chain.props.descriptions}
            onChange={(descriptions) => updateChain({ ...chain, props: { ...chain.props, descriptions } })}
          />

          <CyclesSelector
            cyclesKeysSelected={chain.props.cycles}
            onChange={(cycles) => updateChain({ ...chain, props: { ...chain.props, cycles } })}
          />

          {/* <StepList state={state} Actions={Actions} /> */}
        </div>

        {/* <Step state={state} Actions={Actions} /> */}

        <ButtonBar />
      </div>

      {/* <VariablePrevStepEditor state={state} Actions={Actions} /> */}
    </>
  )
}

export default ChainComponent
