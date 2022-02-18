import './Chain.scss'
import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { useLocationPathMatcher, useOnPageUnload } from '@webapp/components/hooks'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import CyclesSelector from '@webapp/components/survey/CyclesSelector'
import ButtonRStudio from '@webapp/components/ButtonRStudio'
import { FormItem } from '@webapp/components/form/Input'
import { Checkbox } from '@webapp/components/form'

import ButtonBar from './ButtonBar'
import { AnalysisNodeDefs } from './AnalysisNodeDefs'
import BaseUnitSelector from './BaseUnitSelector'
import { StratumAttributeSelector } from './StratumAttributeSelector'

const ChainComponent = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const { chainUuid } = useParams()
  const chain = useChain()
  const validation = Chain.getValidation(chain)
  const survey = useSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)

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

  const locationPathMatcher = useLocationPathMatcher()
  // un unmount, if changing location into node def edit, keep chain store, otherwise reset it
  useEffect(() => {
    return () => {
      if (!locationPathMatcher(`${appModuleUri(analysisModules.nodeDef)}:uuid`)) {
        dispatch(ChainActions.resetChainStore())
      }
    }
  }, [])

  // prevent page unload if label is not specified and chain is not deleted
  useOnPageUnload({
    active: !Validation.isValid(Validation.getFieldValidation(Chain.keysProps.labels)(validation)) && !chain.isDeleted,
    confirmMessageKey: 'chainView.errorNoLabel',
  })

  if (!chain || A.isEmpty(chain)) return null

  return (
    <div className="chain">
      <div className="btn-rstudio-container">
        {Survey.isDraft(surveyInfo) && (
          <small className="btn-rstudio-container-message">{i18n.t('chainView.surveyShouldBePublished')}</small>
        )}
        <ButtonRStudio onClick={_openRStudio} disabled={Survey.isDraft(surveyInfo)} />
        <ButtonRStudio isLocal onClick={_openRStudioLocal} disabled={Survey.isDraft(surveyInfo)} />
      </div>

      <div className="chain-form">
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

        <BaseUnitSelector />

        {baseUnitNodeDef && (
          <>
            <StratumAttributeSelector />

            <FormItem label={i18n.t('chainView.areaWeightingMethod')}>
              <Checkbox
                checked={Chain.isAreaWeightingMethod(chain)}
                validation={Validation.getFieldValidation(Chain.keysProps.areaWeightingMethod)(validation)}
                onChange={(areaWeightingMethod) =>
                  updateChain(Chain.assocAreaWeightingMethod(areaWeightingMethod)(chain))
                }
              />
            </FormItem>
          </>
        )}
      </div>

      <AnalysisNodeDefs />

      <ButtonBar />
    </div>
  )
}

export default ChainComponent
