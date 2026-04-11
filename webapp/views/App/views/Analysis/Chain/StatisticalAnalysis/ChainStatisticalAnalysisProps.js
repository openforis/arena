import './ChainStatisticalAnalysis.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as Chain from '@common/analysis/chain'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useEntityDataCount } from '@webapp/store/surveyRdb/hooks'
import { useChain } from '@webapp/store/ui/chain'

import { ButtonGroup } from '@webapp/components/form'
import WarningBadge from '@webapp/components/warningBadge'
import { FormItem, Input } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { DimensionsSelector } from './DimensionsSelector'
import { PValueSelector } from '../PValueSelector'

export const ChainStatisticalAnalysisProps = (props) => {
  const { updateChain } = props
  const survey = useSurvey()
  const i18n = useI18n()

  const chain = useChain()
  const chainUuid = Chain.getUuid(chain)

  const samplingDesign = Chain.getSamplingDesign(chain)
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chain)
  const dimensionUuids = ChainStatisticalAnalysis.getDimensionUuids(chainStatisticalAnalysis)
  const entityDefUuid = ChainStatisticalAnalysis.getEntityDefUuid(chainStatisticalAnalysis)
  const entityDef = entityDefUuid ? Survey.getNodeDefByUuid(entityDefUuid)(survey) : null
  const entityDataCount = useEntityDataCount(entityDefUuid)

  const entitiesFilterFn = useCallback(
    (entityDef) => {
      const childDefs = Survey.getNodeDefChildren({ nodeDef: entityDef })(survey)
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
      const _chainUpdated = Chain.updateStatisticalAnalysis(updateFn)(chain)
      updateChain(_chainUpdated)
    },
    [chain, updateChain]
  )

  const onEntityChange = useCallback(
    (entityDefUuid) => {
      updateStatisticalAnalysis(ChainStatisticalAnalysis.assocEntityDefUuid(entityDefUuid))
    },
    [updateStatisticalAnalysis]
  )

  const onDimensionsChange = useCallback(
    (dimensionUuidsUpdated) => {
      updateStatisticalAnalysis(ChainStatisticalAnalysis.assocDimensionUuids(dimensionUuidsUpdated))
    },
    [updateStatisticalAnalysis]
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
      <FormItem label="chainView.statisticalAnalysis.entityToReport">
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

      <FormItem label="common.dimension_other">
        <DimensionsSelector
          chainUuid={chainUuid}
          entityDefUuid={ChainStatisticalAnalysis.getEntityDefUuid(chainStatisticalAnalysis)}
          selectedDimensionsUuids={dimensionUuids}
          onDimensionsChange={onDimensionsChange}
          showAnalysisAttributes
          disabled={!entityDefUuid}
        />
      </FormItem>

      <FormItem label="chainView.statisticalAnalysis.filter">
        <Input
          className="filter"
          inputType="textarea"
          onChange={onFilterChange}
          value={ChainStatisticalAnalysis.getFilter(chainStatisticalAnalysis)}
        />
      </FormItem>

      <FormItem label="chainView.statisticalAnalysis.reportingMethod">
        <ButtonGroup
          selectedItemKey={ChainStatisticalAnalysis.getReportingMethod(chainStatisticalAnalysis)}
          onChange={onReportingMethodChange}
          items={reportingMethodItems}
        />
      </FormItem>

      {ChainSamplingDesign.getSamplingStrategy(samplingDesign) && (
        <div className="form_row p-value">
          <PValueSelector />
        </div>
      )}
    </div>
  )
}

ChainStatisticalAnalysisProps.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
