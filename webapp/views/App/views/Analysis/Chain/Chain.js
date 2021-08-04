import './Chain.scss'
import React, { useEffect } from 'react'
import { matchPath, useParams, Prompt } from 'react-router'
import { useDispatch } from 'react-redux'
import classNames from 'classnames'

import * as A from '@core/arena'

import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurveyCycleKeys } from '@webapp/store/survey'

import { useI18n } from '@webapp/store/system'

import { useHistoryListen } from '@webapp/components/hooks'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import ButtonRStudio from '@webapp/components/ButtonRStudio'

import ButtonBar from './ButtonBar'
import { AnalysisNodeDefs } from './AnalysisNodeDefs'

const ChainComponent = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const { chainUuid } = useParams()
  const cycleKeys = useSurveyCycleKeys()
  const chain = useChain()
  const validation = Chain.getValidation(chain)

  const _openRStudio = () => {
    dispatch(ChainActions.openRStudio({ chain }))
  }
  const _openRStudioLocal = () => {
    dispatch(ChainActions.openRStudio({ chain, isLocal: true }))
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

  if (!chain || A.isEmpty(chain)) return null

  return (
    <div className={classNames('chain', { 'with-cycles': cycleKeys.length > 1 })}>
      <Prompt
        when={
          !Validation.isValid(Validation.getFieldValidation(Chain.keysProps.labels)(validation)) && !chain.isDeleted
        }
        message={i18n.t('chainView.errorNoLabel')}
      />

<div className="btn-rstudio-container">
      <ButtonRStudio onClick={_openRStudio} />
      <ButtonRStudio isLocal onClick={_openRStudioLocal} />
      </div>

      <div className="form">
        <LabelsEditor
          labels={chain.props?.labels}
          formLabelKey="chainView.formLabel"
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

        <AnalysisNodeDefs />
      </div>

      <ButtonBar />
    </div>
  )
}

export default ChainComponent
