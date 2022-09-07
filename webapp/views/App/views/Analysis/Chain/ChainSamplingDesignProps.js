import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'
import { FormItem } from '@webapp/components/form/Input'
import { Checkbox } from '@webapp/components/form'

import BaseUnitSelector from './BaseUnitSelector'
import { StratumAttributeSelector } from './StratumAttributeSelector'
import { ClusteringEntitySelector } from './ClusteringEntitySelector'
import { ReportingDataAttributeDefs } from './ReportingDataAttributeDefs'
import { SamplingDesignStrategySelector } from './SamplingDesignStrategySelector'
import { PostStratificationAttributeSelector } from './PostStratificationAttributeSelector'
import { PValueSelector } from './PValueSelector'

export const ChainSamplingDesignProps = (props) => {
  const { updateChain } = props

  const i18n = useI18n()
  const survey = useSurvey()
  const chain = useChain()

  const validation = Chain.getValidation(chain)
  const baseUnitNodeDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const hasBaseUnit = Boolean(baseUnitNodeDef)
  const samplingDesign = Chain.getSamplingDesign(chain)

  return (
    <>
      {(Chain.hasSamplingDesign(chain) || hasBaseUnit) && <BaseUnitSelector />}

      {hasBaseUnit && (
        <>
          <SamplingDesignStrategySelector chain={chain} updateChain={updateChain} />

          {ChainSamplingDesign.isStratificationEnabled(samplingDesign) && <StratumAttributeSelector />}
          {ChainSamplingDesign.isPostStratificationEnabled(samplingDesign) && <PostStratificationAttributeSelector />}

          <ClusteringEntitySelector />

          {ChainSamplingDesign.getClusteringNodeDefUuid(samplingDesign) && (
            <FormItem label={i18n.t('chainView.clusteringOnlyVariances')}>
              <Checkbox
                checked={ChainSamplingDesign.isClusteringOnlyVariances(samplingDesign)}
                validation={Validation.getFieldValidation(ChainSamplingDesign.keysProps.clusteringOnlyVariances)(
                  validation
                )}
                onChange={(clusteringOnlyVariances) =>
                  updateChain(
                    Chain.updateSamplingDesign(
                      ChainSamplingDesign.assocClusteringOnlyVariances(clusteringOnlyVariances)
                    )(chain)
                  )
                }
              />
            </FormItem>
          )}
          <FormItem label={i18n.t('chainView.nonResponseBiasCorrection')}>
            <div className="nonResponseBiasCorrectionContainer">
              <Checkbox
                checked={ChainSamplingDesign.isNonResponseBiasCorrection(samplingDesign)}
                validation={Validation.getFieldValidation(ChainSamplingDesign.keysProps.nonResponseBiasCorrection)(
                  validation
                )}
                onChange={(value) =>
                  updateChain(
                    Chain.updateSamplingDesign(ChainSamplingDesign.assocNonResponseBiasCorrection(value))(chain)
                  )
                }
              />
              <label className="nonResponseBiasCorrectionTip">{i18n.t('chainView.nonResponseBiasCorrectionTip')}</label>
            </div>
          </FormItem>
        </>
      )}

      <ReportingDataAttributeDefs chain={chain} updateChain={updateChain} />

      {ChainSamplingDesign.getSamplingStrategy(samplingDesign) && <PValueSelector />}
    </>
  )
}

ChainSamplingDesignProps.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
