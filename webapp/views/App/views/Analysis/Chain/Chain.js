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
import { useI18n } from '@webapp/store/system'

import { useLocationPathMatcher, useOnPageUnload } from '@webapp/components/hooks'
import ButtonRStudio from '@webapp/components/ButtonRStudio'
import TabBar from '@webapp/components/tabBar'

import ButtonBar from './ButtonBar'
import { AnalysisNodeDefs } from './AnalysisNodeDefs'
import { ChainBasicProps } from './ChainBasicProps'
import { ChainSamplingDesignProps } from './ChainSamplingDesignProps'

const ChainComponent = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const { chainUuid } = useParams()
  const chain = useChain()
  const survey = useSurvey()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const validation = Chain.getValidation(chain)

  const _openRStudio = useCallback(() => {
    dispatch(ChainActions.openRStudio())
  }, [dispatch])

  const _openRStudioLocal = useCallback(() => {
    dispatch(ChainActions.openRStudio({ isLocal: true }))
  }, [dispatch])

  const updateChain = useCallback(
    (chainUpdate) => dispatch(ChainActions.updateChain({ chain: chainUpdate })),
    [dispatch]
  )

  useEffect(() => {
    dispatch(ChainActions.fetchChain({ chainUuid }))

    dispatch(ChainActions.fetchRecordsCountByStep)
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
        <ButtonRStudio onClick={_openRStudio} />
        <ButtonRStudio isLocal onClick={_openRStudioLocal} />
      </div>

      <TabBar
        tabs={[
          {
            label: i18n.t('chainView.basic'),
            component: ChainBasicProps,
            props: {
              updateChain,
            },
          },
          {
            label: i18n.t('chainView.samplingDesign'),
            component: ChainSamplingDesignProps,
            props: {
              updateChain,
            },
          },
        ]}
        showTabs={Chain.isSamplingDesign(chain) || Boolean(baseUnitNodeDef)}
      />

      <AnalysisNodeDefs />

      <ButtonBar />
    </div>
  )
}

export default ChainComponent
