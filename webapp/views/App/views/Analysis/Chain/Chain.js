import './Chain.scss'
import React, { useEffect, useState } from 'react'
import { matchPath, useParams, Prompt } from 'react-router'
import { useDispatch } from 'react-redux'
import classNames from 'classnames'

import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as Chain from '@common/analysis/chain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurveyCycleKeys, useSurveyInfo, useSurveyLang, useSurvey } from '@webapp/store/survey'

import { useI18n } from '@webapp/store/system'

import { useHistoryListen } from '@webapp/components/hooks'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import ButtonRStudio from '@webapp/components/ButtonRStudio'
import * as ChainValidator from '@common/analysis/chainValidator'

import ButtonBar from './ButtonBar'
import { AnalysisNodeDefs } from './AnalysisNodeDefs'

const useLocalChainValidation = ({ chain }) => {
  const [validation, setValidation] = useState({})
  const lang = useSurveyLang()
  const survey = useSurvey()

  useEffect(() => {
    const validate = async () => {
      const _validation = await ChainValidator.validateChain({ chain, defaultLang: lang, survey })
      setValidation(_validation)
    }
    validate()
  }, [chain, lang, survey])

  return validation
}

const ChainComponent = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const { chainUuid } = useParams()
  const surveyInfo = useSurveyInfo()
  const cycleKeys = useSurveyCycleKeys()
  const chain = useChain()
  const validation = useLocalChainValidation({ chain })

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
      <Prompt
        when={!Validation.isValid(Validation.getFieldValidation(Chain.keysProps.labels)(validation))}
        message={i18n.t('chainView.errorNoLabel')}
      />

      <ButtonRStudio onClick={_openRStudio} disabled={Survey.isDraft(surveyInfo)} />

      <div className="form">
        <LabelsEditor
          labels={chain.props.labels}
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
