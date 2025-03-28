import './Chain.scss'

import React, { useCallback, useEffect } from 'react'
import { useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'

import { useLocationPathMatcher, useOnPageUnload } from '@webapp/components/hooks'
import TabBar from '@webapp/components/tabBar'

import ButtonBar from './ButtonBar'
import { AnalysisNodeDefs } from './AnalysisNodeDefs'
import { ChainBasicProps } from './ChainBasicProps'
import { ChainSamplingDesignProps } from './ChainSamplingDesignProps'
import { ChainStatisticalAnalysisProps } from './statisticalAnalysis/ChainStatisticalAnalysisProps'

const ChainComponent = () => {
  const dispatch = useDispatch()
  const { chainUuid } = useParams()
  const chain = useChain()
  const survey = useSurvey()

  const surveyInfo = Survey.getSurveyInfo(survey)
  const canHaveRecords = Survey.isPublished(surveyInfo) || Survey.isFromCollect(surveyInfo)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const validation = Chain.getValidation(chain)

  const updateChain = useCallback(
    (chainUpdate) => dispatch(ChainActions.updateChain({ chain: chainUpdate })),
    [dispatch]
  )

  useEffect(() => {
    const init = async () => {
      dispatch(ChainActions.fetchChain({ chainUuid, validate: true }))
      if (canHaveRecords) {
        dispatch(ChainActions.fetchRecordsCountByStep)
      }
    }
    init()
  }, [dispatch, chainUuid, canHaveRecords])

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
      <TabBar
        tabs={[
          {
            label: 'chainView.basic',
            component: ChainBasicProps,
            props: { updateChain },
          },
          {
            label: 'chainView.samplingDesign',
            component: ChainSamplingDesignProps,
            props: { updateChain },
          },
          {
            label: 'chainView.statisticalAnalysis.header',
            component: ChainStatisticalAnalysisProps,
            props: { updateChain },
          },
        ]}
        showTabs={Chain.hasSamplingDesign(chain) || Boolean(baseUnitNodeDef)}
      />

      <AnalysisNodeDefs />

      <ButtonBar />
    </div>
  )
}

export default ChainComponent
