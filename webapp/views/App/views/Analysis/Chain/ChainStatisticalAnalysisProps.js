import React, { useCallback } from 'react'

import * as Chain from '@common/analysis/chain'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'
import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { FormItem } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { useDispatch } from 'react-redux'

export const ChainStatisticalAnalysisProps = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const i18n = useI18n()

  const chain = useChain()
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chain)

  const onEntityChange = useCallback(
    (entityDefUuid) => {
      const chainUpdated = Chain.updateStatisticalAnalysis(ChainStatisticalAnalysis.assocEntityDefUuid(entityDefUuid))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  return (
    <>
      <FormItem label={i18n.t('chainView.statisticalAnalysis.entity')}>
        <EntitySelector
          hierarchy={Survey.getHierarchy()(survey)}
          nodeDefUuidEntity={ChainStatisticalAnalysis.getEntityUuid(chainStatisticalAnalysis)}
          onChange={onEntityChange}
          showSingleEntities={false}
          useNameAsLabel={true}
          allowEmptySelection={true}
        />
      </FormItem>
    </>
  )
}
