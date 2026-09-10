import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { SurveyState } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

const extraPropNameToItem = (name) => ({ value: name, label: name })

export const FirstPhaseCategoryExtraPropSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)
  const firstPhaseCategoryUuid = ChainSamplingDesign.getFirstPhaseCategoryUuid(samplingDesign)

  const extraPropNames = useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const firstPhaseCategory = Survey.getCategoryByUuid(firstPhaseCategoryUuid)(survey)
    if (!firstPhaseCategory) return []
    return Category.getItemExtraDefKeys(firstPhaseCategory).filter(
      (name) => name !== Category.reportingDataItemExtraDefKeys.area
    )
  }, Objects.isEqual)

  const emptyItem = { value: null, label: i18n.t('common.notSpecified') }
  const items = [emptyItem, ...extraPropNames.map(extraPropNameToItem)]

  const selectedName = ChainSamplingDesign.getFirstPhaseCategoryExtraProp(samplingDesign)
  const selectedItem =
    selectedName && extraPropNames.includes(selectedName) ? extraPropNameToItem(selectedName) : emptyItem

  const onChange = useCallback(
    (item) => {
      const chainUpdated = Chain.updateSamplingDesign(
        ChainSamplingDesign.assocFirstPhaseCategoryExtraProp(item?.value)
      )(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  return (
    <FormItem label="chainView.firstPhaseCategoryExtraProp.label" info="chainView.firstPhaseCategoryExtraProp.info">
      <Dropdown
        items={items}
        selection={selectedItem}
        onChange={onChange}
        disabled={!editable || !firstPhaseCategoryUuid}
      />
    </FormItem>
  )
}
