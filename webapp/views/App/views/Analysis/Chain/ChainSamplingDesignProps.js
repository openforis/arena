import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { useSurvey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'

import BaseUnitSelector from './BaseUnitSelector'
import { StratumAttributeSelector } from './StratumAttributeSelector'
import { ClusteringEntitySelector } from './ClusteringEntitySelector'
import { SamplingDesignStrategySelector } from './SamplingDesignStrategySelector'
import { PostStratificationAttributeSelector } from './PostStratificationAttributeSelector'
import { ReportingDataAttributeDefs } from './ReportingDataAttributeDefs'

export const ChainSamplingDesignProps = (props) => {
  const { updateChain } = props

  const survey = useSurvey()
  const chain = useChain()

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

          <ReportingDataAttributeDefs />
        </>
      )}
    </>
  )
}

ChainSamplingDesignProps.propTypes = {
  updateChain: PropTypes.func.isRequired,
}
