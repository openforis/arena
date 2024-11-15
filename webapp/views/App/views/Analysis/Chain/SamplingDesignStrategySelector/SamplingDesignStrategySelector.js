import React from 'react'
import PropTypes from 'prop-types'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

export const SamplingDesignStrategySelector = (props) => {
  const { chain, updateChain } = props

  const i18n = useI18n()

  const samplingStrategyCodeToItem = (samplingStrategyCode) => ({
    value: samplingStrategyCode,
    label: i18n.t(`chainView.samplingStrategy.${samplingStrategyCode}`),
  })

  const emptyItem = { value: null, label: i18n.t('common.notSpecified') }

  const items = [emptyItem, ...Object.values(ChainSamplingDesign.samplingStrategies).map(samplingStrategyCodeToItem)]

  const samplingDesing = Chain.getSamplingDesign(chain)
  const samplingStrategy = ChainSamplingDesign.getSamplingStrategy(samplingDesing)
  const selectedItem = samplingStrategy ? samplingStrategyCodeToItem(samplingStrategy) : emptyItem

  return (
    <FormItem label="chainView.samplingStrategyLabel">
      <Dropdown
        items={items}
        selection={selectedItem}
        onChange={(item) =>
          updateChain(Chain.updateSamplingDesign(ChainSamplingDesign.assocSamplingStrategy(item?.value))(chain))
        }
      />
    </FormItem>
  )
}

SamplingDesignStrategySelector.propTypes = {
  chain: PropTypes.object.isRequired,
  updateChain: PropTypes.func.isRequired,
}
