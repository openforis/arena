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
import { useEntityDataCount } from '@webapp/store/surveyRdb/hooks'
import { ChainActions, useChain } from '@webapp/store/ui/chain'

import { ButtonGroup } from '@webapp/components/form'
import WarningBadge from '@webapp/components/warningBadge'
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
  const entityDefUuid = ChainStatisticalAnalysis.getEntityDefUuid(chainStatisticalAnalysis)
  const entityDef = entityDefUuid ? Survey.getNodeDefByUuid(entityDefUuid)(survey) : null
  const entityDataCount = useEntityDataCount(entityDefUuid)

  const entitiesFilterFn = useCallback(
    (entityDef) => {
      const childDefs = Survey.getNodeDefChildren(entityDef, true)(survey)
      return childDefs.some(
        (childDef) =>
          NodeDef.getChainUuid(childDef) === chainUuid &&
          NodeDef.isActive(childDef) &&
          NodeDef.hasAreaBasedEstimated(childDef)
      )
    },
    [chainUuid, survey]
  )

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

  const onFilterChange = useCallback(
    (filter) => updateStatisticalAnalysis(ChainStatisticalAnalysis.assocFilter(filter)),
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
        <div className="entity-selector-wrapper">
          <EntitySelector
            hierarchy={Survey.getHierarchy()(survey)}
            filterFn={entitiesFilterFn}
            nodeDefUuidEntity={entityDefUuid}
            onChange={onEntityChange}
            showSingleEntities={false}
            useNameAsLabel
            allowEmptySelection
          />
          {entityDataCount === 0 && (
            <WarningBadge
              title="chainView.statisticalAnalysis.entityWithoutData"
              titleParams={{ name: NodeDef.getName(entityDef) }}
            />
          )}
        </div>
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

      <FormItem label={i18n.t('chainView.statisticalAnalysis.filter')}>
        <Input
          className="filter"
          inputType="textarea"
          onChange={onFilterChange}
          value={ChainStatisticalAnalysis.getFilter(chainStatisticalAnalysis)}
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
