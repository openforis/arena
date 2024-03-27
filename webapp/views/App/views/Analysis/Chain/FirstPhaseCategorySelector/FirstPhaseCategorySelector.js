import React from 'react'
import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import * as Category from '@core/survey/category'

import { FormItem } from '@webapp/components/form/Input'
import { CategorySelector } from '@webapp/components/survey/CategorySelector'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain } from '@webapp/store/ui/chain'

export const FirstPhaseCategorySelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useChain()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = (category) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocFirstPhaseCategoryUuid(Category.getUuid(category))
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label={i18n.t('chainView.firstPhaseCategory')}>
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
