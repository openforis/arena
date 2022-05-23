import React from 'react'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'

import * as Chain from '@common/analysis/chain'
import * as Survey from '@core/survey/survey'

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

  return (
    <>
      {(Chain.isSamplingDesign(chain) || hasBaseUnit) && <BaseUnitSelector />}

      {hasBaseUnit && (
        <>
          <SamplingDesignStrategySelector chain={chain} updateChain={updateChain} />

          {Chain.isStratificationEnabled(chain) && (
            <>
              <StratumAttributeSelector />
              <FormItem label={i18n.t('chainView.nonResponseBiasCorrection')}>
                <Checkbox
                  checked={Chain.isNonResponseBiasCorrection(chain)}
                  validation={Validation.getFieldValidation(Chain.keysProps.nonResponseBiasCorrection)(validation)}
                  onChange={(value) => updateChain(Chain.assocNonResponseBiasCorrection(value)(chain))}
                />
              </FormItem>
            </>
          )}
          {Chain.isPostStratificationEnabled(chain) && <PostStratificationAttributeSelector />}

          <ClusteringEntitySelector />

          {Chain.getClusteringNodeDefUuid(chain) && (
            <FormItem label={i18n.t('chainView.clusteringOnlyVariances')}>
              <Checkbox
                checked={Chain.isClusteringOnlyVariances(chain)}
                validation={Validation.getFieldValidation(Chain.keysProps.clusteringOnlyVariances)(validation)}
                onChange={(clusteringOnlyVariances) =>
                  updateChain(Chain.assocClusteringOnlyVariances(clusteringOnlyVariances)(chain))
                }
              />
            </FormItem>
          )}
        </>
      )}

      <ReportingDataAttributeDefs chain={chain} updateChain={updateChain} />

      {Chain.getSamplingStrategy(chain) && <PValueSelector />}
    </>
  )
}

ChainSamplingDesignProps.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
