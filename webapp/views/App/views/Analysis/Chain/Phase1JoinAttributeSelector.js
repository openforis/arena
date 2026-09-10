import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { SurveyState } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

const codeAttributeName = 'code'

const attributeNameToItem = (name) => ({ value: name, label: name })

export const Phase1JoinAttributeSelector = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)
  const phase1CategoryUuid = ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)

  const attributeNames = useSelector((state) => {
    const survey = SurveyState.getSurvey(state)
    const phase1Category = Survey.getCategoryByUuid(phase1CategoryUuid)(survey)
    if (!phase1Category) return [codeAttributeName]
    const extraPropNames = Category.getItemExtraDefsArray(phase1Category)
      .filter((extraDef) => ExtraPropDef.getDataType(extraDef) !== ExtraPropDef.dataTypes.geometryPoint)
      .map(ExtraPropDef.getName)
    return [codeAttributeName, ...extraPropNames]
  }, Objects.isEqual)

  const emptyItem = { value: null, label: i18n.t('common.notSpecified') }
  const items = [emptyItem, ...attributeNames.map(attributeNameToItem)]

  const selectedName = ChainSamplingDesign.getPhase1JoinAttribute(samplingDesign)
  const selectedItem =
    selectedName && attributeNames.includes(selectedName) ? attributeNameToItem(selectedName) : emptyItem

  const onChange = useCallback(
    (item) => {
      const chainUpdated = Chain.updateSamplingDesign(ChainSamplingDesign.assocPhase1JoinAttribute(item?.value))(chain)
      dispatch(ChainActions.updateChain({ chain: chainUpdated }))
    },
    [chain, dispatch]
  )

  return (
    <FormItem label="chainView.phase1JoinAttribute.label" info="chainView.phase1JoinAttribute.info">
      <Dropdown
        items={items}
        selection={selectedItem}
        onChange={onChange}
        disabled={!editable || !phase1CategoryUuid}
      />
    </FormItem>
  )
}
