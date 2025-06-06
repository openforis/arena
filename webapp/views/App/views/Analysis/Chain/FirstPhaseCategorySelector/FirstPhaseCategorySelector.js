import React from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import * as Category from '@core/survey/category'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { FormItem } from '@webapp/components/form/Input'
import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { CategorySelector } from '@webapp/components/survey/CategorySelector'

export const FirstPhaseCategorySelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = (category) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocFirstPhaseCategoryUuid(Category.getUuid(category))
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label="chainView.firstPhaseCategory">
      <CategorySelector
        categoryUuid={ChainSamplingDesign.getFirstPhaseCategoryUuid(samplingDesign)}
        onChange={onChange}
        showAdd={false}
        showEdit
        showManage={false}
      />
    </FormItem>
  )
}
