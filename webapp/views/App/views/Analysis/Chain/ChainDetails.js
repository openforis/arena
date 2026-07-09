import './ChainDetails.scss'

import React, { useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/chain'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'

import { useLocationPathMatcher, useOnPageUnload, useQuery } from '@webapp/components/hooks'
import TabBar from '@webapp/components/tabBar'

import ButtonBar from './ButtonBar'
import { AnalysisNodeDefs } from './AnalysisNodeDefs'
import { ChainBasicProps } from './ChainBasicProps'
import { ChainSamplingDesignProps } from './ChainSamplingDesignProps'

const ChainDetails = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { chainUuid } = useParams()
  const { new: justCreated } = useQuery()
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
      if (justCreated === 'true') {
        dispatch(ChainActions.setEditLocked(false))
        navigate(`${appModuleUri(analysisModules.chain)}${chainUuid}/`, { replace: true })
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        ]}
        showTabs={Chain.hasSamplingDesign(chain) || Boolean(baseUnitNodeDef)}
      />

      <AnalysisNodeDefs />

      <ButtonBar />
    </div>
  )
}

export default ChainDetails
