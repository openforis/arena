import React from 'react'
import PropTypes from 'prop-types'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'

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

  return (
    <div className="chain-sampling-design">
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
  )
}

ChainSamplingDesignProps.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
