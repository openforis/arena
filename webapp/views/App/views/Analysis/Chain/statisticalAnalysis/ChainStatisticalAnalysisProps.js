import './ChainStatisticalAnalysis.scss'

import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

import { debounceAction } from '@webapp/utils/reduxUtils'
import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useEntityDataCount } from '@webapp/store/surveyRdb/hooks'
import { ChainActions, useChain } from '@webapp/store/ui/chain'

import { ButtonGroup, Checkbox } from '@webapp/components/form'
import WarningBadge from '@webapp/components/warningBadge'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import { EntitySelector } from '@webapp/components/survey/NodeDefsSelector'
import { DimensionsSelector } from './DimensionsSelector'
import { PValueSelector } from '../PValueSelector'

export const ChainStatisticalAnalysisProps = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const i18n = useI18n()

  const chain = useChain()
  const chainUuid = Chain.getUuid(chain)
  const [chainUpdated, setChainUpdated] = useState(chain)

  const samplingDesign = Chain.getSamplingDesign(chain)
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chainUpdated)
  const validation = Chain.getValidation(chain)
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

  const onClusteringOnlyVariancesChange = useCallback(
    (clusteringOnlyVariances) =>
      updateStatisticalAnalysis(ChainStatisticalAnalysis.assocClusteringOnlyVariances(clusteringOnlyVariances)),
    [updateStatisticalAnalysis]
  )

  const onNonResponseBiasCorrectionChange = useCallback(
    (value) => updateStatisticalAnalysis(ChainStatisticalAnalysis.assocNonResponseBiasCorrection(value)),
    [updateStatisticalAnalysis]
  )

  const onReportingAreaChange = useCallback(
    (value) => updateStatisticalAnalysis(ChainStatisticalAnalysis.assocReportingArea(value)),
    [updateStatisticalAnalysis]
  )

  const reportingAreaFormItem = (
    <FormItem className="reporting-area" label={i18n.t('chainView.statisticalAnalysis.reportingArea')}>
      <Input
        numberFormat={NumberFormats.decimal()}
        onChange={onReportingAreaChange}
        value={ChainStatisticalAnalysis.getReportingArea(chainStatisticalAnalysis)}
      />
    </FormItem>
  )

  return (
    <div className="statistical-analysis">
      <FormItem label={i18n.t('chainView.statisticalAnalysis.entityToReport')}>
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
        <DimensionsSelector
          chainUuid={chainUuid}
          entityDefUuid={ChainStatisticalAnalysis.getEntityDefUuid(chainStatisticalAnalysis)}
          selectedDimensionsUuids={dimensionUuids}
          onDimensionsChange={onDimensionsChange}
          showAnalysisAttributes
          disabled={!entityDefUuid}
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

      {ChainSamplingDesign.getClusteringNodeDefUuid(samplingDesign) && (
        <FormItem label={i18n.t('chainView.clusteringOnlyVariances')}>
          <Checkbox
            checked={ChainStatisticalAnalysis.isClusteringOnlyVariances(chainStatisticalAnalysis)}
            validation={Validation.getFieldValidation(ChainStatisticalAnalysis.keys.clusteringOnlyVariances)(
              validation
            )}
            onChange={onClusteringOnlyVariancesChange}
          />
        </FormItem>
      )}

      <FormItem label={i18n.t('chainView.nonResponseBiasCorrection')}>
        <div className="nonResponseBiasCorrectionContainer">
          <Checkbox
            checked={ChainStatisticalAnalysis.isNonResponseBiasCorrection(chainStatisticalAnalysis)}
            validation={Validation.getFieldValidation(ChainStatisticalAnalysis.keys.nonResponseBiasCorrection)(
              validation
            )}
            onChange={onNonResponseBiasCorrectionChange}
          />
          <label className="nonResponseBiasCorrectionTip">{i18n.t('chainView.nonResponseBiasCorrectionTip')}</label>
        </div>
      </FormItem>

      {ChainSamplingDesign.getSamplingStrategy(samplingDesign) && (
        <div className="form_row p-value">
          <PValueSelector />
          {reportingAreaFormItem}
        </div>
      )}

      {!ChainSamplingDesign.getSamplingStrategy(samplingDesign) && reportingAreaFormItem}
    </div>
  )
}
