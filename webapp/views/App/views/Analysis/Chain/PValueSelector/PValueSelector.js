import React from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainStatisticalAnalysis } from '@common/analysis/chainStatisticalAnalysis'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain } from '@webapp/store/ui/chain'

const pValueToItem = (value) => ({ value, label: String(value) })

export const PValueSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useChain()
  const statisticalAnalysis = Chain.getStatisticalAnalysis(chain)

  const items = ChainStatisticalAnalysis.pValues.map(pValueToItem)

  const selectedItem = pValueToItem(ChainStatisticalAnalysis.getPValue(statisticalAnalysis))

  const onChange = (item) => {
    const chainUpdated = Chain.updateStatisticalAnalysis(ChainStatisticalAnalysis.assocPValue(item?.value))(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label={i18n.t('chainView.pValue')}>
      <Dropdown
        className="p-value-dropdown"
        clearable={false}
        items={items}
        selection={selectedItem}
        onChange={onChange}
      />
    </FormItem>
  )
}
