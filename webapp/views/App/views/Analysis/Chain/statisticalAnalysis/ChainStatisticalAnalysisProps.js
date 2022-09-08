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
import { Dropdown } from '@webapp/components/form'

export const ChainStatisticalAnalysisProps = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const chain = useChain()
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chain)
  const dimensionUuids = ChainStatisticalAnalysis.getDimensionUuids(chainStatisticalAnalysis)

  const reportingMethodItems = Object.entries(ChainStatisticalAnalysis.reportingMethods).map(([key, name]) => ({
    key,
    value: i18n.t(`chainView.statisticalAnalysis.reportingMethods.${name}`),
  }))
  const selectedReportingMethodItem = reportingMethodItems.find(
    (item) => item.key === ChainStatisticalAnalysis.getReportingMethod(chainStatisticalAnalysis)
  )

  const updateStatisticalAnalysis = useCallback(
    (updateFn) => {
      const chainUpdated = Chain.updateStatisticalAnalysis(updateFn)(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  const onEntityChange = useCallback(
    (entityDefUuid) => {
      updateStatisticalAnalysis(ChainStatisticalAnalysis.assocEntityDefUuid(entityDefUuid))
    },
    [updateStatisticalAnalysis]
  )

  const onDimensionToggle = useCallback(
    (attributeUuid) => {
      const dimensionUuidsUpdated = ArrayUtils.addOrRemoveItem({ item: attributeUuid })(dimensionUuids)
      updateStatisticalAnalysis(ChainStatisticalAnalysis.assocDimensionUuids(dimensionUuidsUpdated))
    },
    [dimensionUuids, updateStatisticalAnalysis]
  )

  const onReportingMethodChange = useCallback(
    (reportingMethod) => {
      updateStatisticalAnalysis(ChainStatisticalAnalysis.assocReportingMethod(reportingMethod?.key))
    },
    [updateStatisticalAnalysis]
  )

  return (
    <div className="statistical-analysis">
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
          onToggleAttribute={onDimensionToggle}
          filterChainUuids={[Chain.getUuid(chain)]}
          filterFunction={(nodeDef) => NodeDef.isAnalysis(nodeDef)}
          filterTypes={[NodeDef.nodeDefType.boolean, NodeDef.nodeDefType.code, NodeDef.nodeDefType.taxon]}
          showAnalysisAttributes
          showAncestors
          showMultipleAttributes={false}
          showSiblingsInSingleEntities={true}
          nodeDefLabelType={NodeDef.NodeDefLabelTypes.name}
        />
      </FormItem>

      <FormItem label={i18n.t('chainView.statisticalAnalysis.reportingMethod')}>
        <Dropdown
          className="reporting-method"
          items={reportingMethodItems}
          onChange={onReportingMethodChange}
          selection={selectedReportingMethodItem}
        />
      </FormItem>
    </div>
  )
}
