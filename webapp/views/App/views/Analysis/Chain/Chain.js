import './Chain.scss'
import React, { useEffect } from 'react'
import { matchPath, useParams } from 'react-router'
import { useDispatch } from 'react-redux'
import classNames from 'classnames'

import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as Chain from '@common/analysis/processingChain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurveyCycleKeys, useSurveyInfo } from '@webapp/store/survey'

import { useHistoryListen } from '@webapp/components/hooks'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import ButtonRStudio from '@webapp/components/ButtonRStudio'

import ButtonBar from './ButtonBar'
import { ChainNodeDefs } from './ChainNodeDefs'

const ChainComponent = () => {
  const dispatch = useDispatch()
  const { chainUuid } = useParams()
  const surveyInfo = useSurveyInfo()
  const cycleKeys = useSurveyCycleKeys()

  const chain = useChain()
  const validation = Chain.getValidation(chain)

  const _openRStudio = () => {
    dispatch(ChainActions.openRStudio({ chain }))
  }
  const updateChain = (chainUpdate) => dispatch(ChainActions.updateChain({ chain: chainUpdate }))

  useEffect(() => {
    dispatch(ChainActions.fetchChain({ chainUuid }))
  }, [chainUuid])

  useHistoryListen((location) => {
    const path = appModuleUri(analysisModules.nodeDef)
    if (!matchPath(location.pathname, { path })) {
      dispatch(ChainActions.resetChainStore())
    }
  }, [])

  if (!chain) return null

  return (
    <div className={classNames('chain', { 'with-cycles': cycleKeys.length > 1 })}>
      <ButtonRStudio onClick={_openRStudio} disabled={Survey.isDraft(surveyInfo)} />

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

        <ChainNodeDefs />
      </div>

      <ButtonBar />
    </div>
  )
}

export default ChainComponent
