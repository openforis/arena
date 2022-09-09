import './ChainStatisticalAnalysis.scss'

import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'
import { ArrayUtils } from '@core/arrayUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { debounceAction } from '@webapp/utils/reduxUtils'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { ButtonGroup } from '@webapp/components/form'
import { FormItem, Input } from '@webapp/components/form/Input'
import { AttributesSelector, EntitySelector } from '@webapp/components/survey/NodeDefsSelector'

export const ChainStatisticalAnalysisProps = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const chain = useChain()
  const chainUuid = Chain.getUuid(chain)
  const [chainUpdated, setChainUpdated] = useState(chain)
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chainUpdated)
  const dimensionUuids = ChainStatisticalAnalysis.getDimensionUuids(chainStatisticalAnalysis)

  const reportingMethodItems = Object.entries(ChainStatisticalAnalysis.reportingMethods).map(([key, name]) => ({
    key,
    label: i18n.t(`chainView.statisticalAnalysis.reportingMethods.${name}`),
  }))

  const updateStatisticalAnalysis = useCallback(
    (updateFn) => {
      const _chainUpdated = Chain.updateStatisticalAnalysis(updateFn)(chainUpdated)
      dispatch(
        debounceAction(ChainActions.updateChain({ chain: _chainUpdated }), 'update-chain-statistical-analysis'),
        1000
      )
      setChainUpdated(_chainUpdated)
    },
    [chainUpdated, dispatch]
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

  const onFilteringChange = useCallback(
    (filtering) => updateStatisticalAnalysis(ChainStatisticalAnalysis.assocFiltering(filtering)),
    [updateStatisticalAnalysis]
  )

  const onReportingMethodChange = useCallback(
    (reportingMethod) => {
      updateStatisticalAnalysis(ChainStatisticalAnalysis.assocReportingMethod(reportingMethod))
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
                  NodeDef.getChainUuid(childDef) === chainUuid &&
                  NodeDef.isActive(childDef) &&
                  NodeDef.hasAreaBasedEstimated(childDef)
              )
            }
            return false
          })(survey)}
          nodeDefUuidEntity={ChainStatisticalAnalysis.getEntityDefUuid(chainStatisticalAnalysis)}
          onChange={onEntityChange}
          showSingleEntities={false}
          useNameAsLabel
          allowEmptySelection
        />
      </FormItem>

      <FormItem label={i18n.t('common.dimension_plural')}>
        <AttributesSelector
          lang={lang}
          nodeDefUuidEntity={ChainStatisticalAnalysis.getEntityDefUuid(chainStatisticalAnalysis)}
          nodeDefUuidsAttributes={dimensionUuids}
          onToggleAttribute={onDimensionToggle}
          filterChainUuids={[chainUuid]}
          filterTypes={[NodeDef.nodeDefType.boolean, NodeDef.nodeDefType.code, NodeDef.nodeDefType.taxon]}
          showAnalysisAttributes
          showAncestors
          showMultipleAttributes={false}
          showSiblingsInSingleEntities
          nodeDefLabelType={NodeDef.NodeDefLabelTypes.name}
        />
      </FormItem>

      <FormItem label={i18n.t('chainView.statisticalAnalysis.filtering')}>
        <Input
          className="filtering"
          inputType="textarea"
          onChange={onFilteringChange}
          value={ChainStatisticalAnalysis.getFiltering(chainStatisticalAnalysis)}
        />
      </FormItem>

      <FormItem label={i18n.t('chainView.statisticalAnalysis.reportingMethod')}>
        <ButtonGroup
          selectedItemKey={ChainStatisticalAnalysis.getReportingMethod(chainStatisticalAnalysis)}
          onChange={onReportingMethodChange}
          items={reportingMethodItems}
        />
      </FormItem>
    </div>
  )
}
