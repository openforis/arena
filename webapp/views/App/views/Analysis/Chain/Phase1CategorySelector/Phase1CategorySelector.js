import { useDispatch } from 'react-redux'

import * as Chain from '@common/analysis/chain'
import * as Category from '@core/survey/category'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'

import { FormItem } from '@webapp/components/form/Input'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'
import { CategorySelector } from '@webapp/components/survey/CategorySelector'

export const Phase1CategorySelector = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const editable = useChainEditable()
  const samplingDesign = Chain.getSamplingDesign(chain)

  const onChange = (category) => {
    const chainUpdated = Chain.updateSamplingDesign(
      ChainSamplingDesign.assocPhase1CategoryUuid(Category.getUuid(category))
    )(chain)
    dispatch(ChainActions.updateChain({ chain: chainUpdated }))
  }

  return (
    <FormItem label="chainView.phase1Category" info="chainView.phase1CategoryInfo">
      <CategorySelector
        categoryUuid={ChainSamplingDesign.getPhase1CategoryUuid(samplingDesign)}
        onChange={onChange}
        showAdd={false}
        showEdit={editable}
        showManage={false}
        disabled={!editable}
      />
    </FormItem>
  )
}
