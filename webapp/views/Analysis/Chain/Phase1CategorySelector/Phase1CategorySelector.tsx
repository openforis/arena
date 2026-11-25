import * as Chain from '@common/analysis/chain'
import { ChainSamplingDesign } from '@common/analysis/chainSamplingDesign'
import * as Category from '@core/survey/category'
import { FormItem } from '@webapp/components/form/Input'
import { CategorySelector } from '@webapp/components/survey/CategorySelector'
import { useAppDispatch } from '@webapp/store'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

export const Phase1CategorySelector = () => {
  const dispatch = useAppDispatch()
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
