import './ChainStatisticalAnalysis.scss'

import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { FormItem } from '@webapp/components/form/Input'
import { AttributesSelector, EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { ArrayUtils } from '@core/arrayUtils'

export const ChainStatisticalAnalysisProps = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const chain = useChain()
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chain)
  const dimensionUuids = ChainStatisticalAnalysis.getDimensionUuids(chainStatisticalAnalysis)

  const onEntityChange = useCallback(
    (entityDefUuid) => {
      const chainUpdated = Chain.updateStatisticalAnalysis(ChainStatisticalAnalysis.assocEntityDefUuid(entityDefUuid))(
        chain
      )
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  const onToggleAttribute = useCallback(
    (attributeUuid) => {
      const dimensionUuidsUpdated = ArrayUtils.addOrRemoveItem({ item: attributeUuid })(dimensionUuids)
      const chainUpdated = Chain.updateStatisticalAnalysis(
        ChainStatisticalAnalysis.assocDimensionUuids(dimensionUuidsUpdated)
      )(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dimensionUuids, dispatch]
  )

  return (
    <>
      <FormItem label={i18n.t('common.entity')}>
        <EntitySelector
          hierarchy={Survey.getHierarchy((nodeDef) => {
            if (NodeDef.isEntity(nodeDef)) {
              const childDefs = Survey.getNodeDefChildren(nodeDef, true)(survey)

              return childDefs.some(
                (childDef) =>
                  NodeDef.getChainUuid(childDef) === Chain.getUuid(chain) &&
                  NodeDef.isActive(childDef) &&
                  NodeDef.hasAreaBasedEstimated(childDef)
              )
            }
            return false
          })(survey)}
          nodeDefUuidEntity={ChainStatisticalAnalysis.getEntityDefUuid(chainStatisticalAnalysis)}
          onChange={onEntityChange}
          showSingleEntities={false}
          useNameAsLabel={true}
          allowEmptySelection={true}
        />
      </FormItem>

      <FormItem label={i18n.t('common.dimension_plural')}>
        <AttributesSelector
          lang={lang}
          nodeDefUuidEntity={ChainStatisticalAnalysis.getEntityDefUuid(chainStatisticalAnalysis)}
          nodeDefUuidsAttributes={dimensionUuids}
          onToggleAttribute={onToggleAttribute}
          filterChainUuids={[Chain.getUuid(chain)]}
          filterTypes={[NodeDef.nodeDefType.boolean, NodeDef.nodeDefType.code, NodeDef.nodeDefType.taxon]}
          showAnalysisAttributes
          showAncestors
          showMultipleAttributes={false}
          showSiblingsInSingleEntities={true}
          nodeDefLabelType={NodeDef.NodeDefLabelTypes.name}
        />
      </FormItem>
    </>
  )
}
