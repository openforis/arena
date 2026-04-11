import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'

import { useSurvey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'

import { Checkbox } from '@webapp/components/form'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'

import BaseUnitSelector from './BaseUnitSelector'
import { ClusteringEntitySelector } from './ClusteringEntitySelector'
import { FirstPhaseCategorySelector } from './FirstPhaseCategorySelector'
import { FirstPhaseCommonAttributeSelector } from './FirstPhaseCommonAttributeSelector'
import { SamplingDesignStrategySelector } from './SamplingDesignStrategySelector'
import { StratumAttributeSelector } from './StratumAttributeSelector'

export const ChainSamplingDesignProps = (props) => {
  const { updateChain } = props

  const survey = useSurvey()
  const chain = useChain()

  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const hasBaseUnit = Boolean(baseUnitNodeDef)
  const samplingDesign = Chain.getSamplingDesign(chain)
  const chainStatisticalAnalysis = Chain.getStatisticalAnalysis(chain)
  const validation = Chain.getValidation(chain)

  const updateStatisticalAnalysis = useCallback(
    (updateFn) => {
      const _chainUpdated = Chain.updateStatisticalAnalysis(updateFn)(chain)
      updateChain(_chainUpdated)
    },
    [chain, updateChain]
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

  return (
    <div className="chain-sampling-design">
      <div className="form">
        {(Chain.hasSamplingDesign(chain) || hasBaseUnit) && <BaseUnitSelector />}

        {hasBaseUnit && (
          <>
            <SamplingDesignStrategySelector chain={chain} updateChain={updateChain} />

            {ChainSamplingDesign.isStratificationEnabled(samplingDesign) && <StratumAttributeSelector />}
            {/* {ChainSamplingDesign.isPostStratificationEnabled(samplingDesign) && <PostStratificationAttributeSelector />} */}

            {ChainSamplingDesign.isFirstPhaseCategorySelectionEnabled(samplingDesign) && <FirstPhaseCategorySelector />}

            {ChainSamplingDesign.isFirstPhaseCommonAttributeSelectionEnabled(samplingDesign) && (
              <FirstPhaseCommonAttributeSelector />
            )}

            <ClusteringEntitySelector />
          </>
        )}
      </div>
      <div className="form form-right">
        {ChainSamplingDesign.getClusteringNodeDefUuid(samplingDesign) && (
          <FormItem className="clustering-only-variances" label="chainView.clusteringOnlyVariances">
            <Checkbox
              checked={ChainStatisticalAnalysis.isClusteringOnlyVariances(chainStatisticalAnalysis)}
              validation={Validation.getFieldValidation(ChainStatisticalAnalysis.keys.clusteringOnlyVariances)(
                validation
              )}
              onChange={onClusteringOnlyVariancesChange}
            />
          </FormItem>
        )}

        <FormItem label="chainView.nonResponseBiasCorrection" info="chainView.nonResponseBiasCorrectionInfo">
          <Checkbox
            checked={ChainStatisticalAnalysis.isNonResponseBiasCorrection(chainStatisticalAnalysis)}
            validation={Validation.getFieldValidation(ChainStatisticalAnalysis.keys.nonResponseBiasCorrection)(
              validation
            )}
            onChange={onNonResponseBiasCorrectionChange}
          />
        </FormItem>

        <FormItem
          className="reporting-area"
          label="chainView.statisticalAnalysis.reportingArea"
          info="chainView.statisticalAnalysis.reportingAreaInfo"
        >
          <Input
            numberFormat={NumberFormats.decimal()}
            onChange={onReportingAreaChange}
            value={ChainStatisticalAnalysis.getReportingArea(chainStatisticalAnalysis)}
          />
        </FormItem>
      </div>
    </div>
  )
}

ChainSamplingDesignProps.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
