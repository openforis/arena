import React from 'react'
import PropTypes from 'prop-types'

import * as Chain from '@common/analysis/chain'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

export const SamplingDesignStrategySelector = (props) => {
  const { chain, updateChain } = props

  const i18n = useI18n()

  const samplingStrategyCodeToItem = (samplingStrategyCode) => ({
    key: samplingStrategyCode,
    label: i18n.t(`chainView.samplingStrategy.${samplingStrategyCode}`),
  })

  const emptyItem = { key: null, label: i18n.t('common.notSpecified') }

  const items = [emptyItem, ...Object.values(Chain.samplingStrategies).map(samplingStrategyCodeToItem)]

  const selectedItem = Chain.getSamplingStrategy(chain)
    ? samplingStrategyCodeToItem(Chain.getSamplingStrategy(chain))
    : emptyItem

  return (
    <FormItem label={i18n.t('chainView.samplingStrategyLabel')}>
      <Dropdown
        className="sampling-strategy-dropdown"
        items={items}
        selection={selectedItem}
        itemLabel="label"
        onChange={(item) => updateChain(Chain.assocSamplingStrategy(item?.key)(chain))}
      />
    </FormItem>
  )
}

SamplingDesignStrategySelector.propTypes = {
  chain: PropTypes.object.isRequired,
  updateChain: PropTypes.func.isRequired,
}
