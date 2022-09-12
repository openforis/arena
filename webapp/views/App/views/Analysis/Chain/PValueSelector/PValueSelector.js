import React from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain } from '@webapp/store/ui/chain'

const pValueToItem = (value) => ({ key: value, label: value })

export const PValueSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const items = ChainSamplingDesign.pValues.map(pValueToItem)

  const selectedItem = pValueToItem(ChainSamplingDesign.getPValue(samplingDesign))

  const onChange = (item) => {
    const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocPValue(item?.key))(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label={i18n.t('chainView.pValue')}>
      <Dropdown
        className="p-value-dropdown"
        items={items}
        selection={selectedItem}
        itemLabel="label"
        onChange={onChange}
      />
    </FormItem>
  )
}
