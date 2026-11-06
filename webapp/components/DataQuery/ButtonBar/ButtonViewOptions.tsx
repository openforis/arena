import { useDispatch } from 'react-redux'

import { Query } from '@common/model/query'
import * as NodeDef from '@core/survey/nodeDef'

import { ButtonMenu, type ButtonMenuItem } from '@webapp/components/buttons'
import { DataExplorerActions, DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'

type Props = {
  nodeDefLabelType: string
  onNodeDefLabelTypeChange: () => void
}

/**
 * Menu with the options affecting how the query data is displayed (names, codes, totals).
 * @param {Props} props - The component props.
 * @returns {React.ReactElement} - The view options menu button.
 */
export const ButtonViewOptions = (props: Props) => {
  const { nodeDefLabelType, onNodeDefLabelTypeChange } = props

  const dispatch = useDispatch()
  const displayType = DataExplorerSelectors.useDisplayType()
  const query = DataExplorerSelectors.useQuery()
  const codesVisible = DataExplorerSelectors.useCodesVisible()
  const totalsVisible = DataExplorerSelectors.useTotalsVisible()

  const displayTypeTable = displayType === DataExplorerState.displayTypes.table
  const singleMeasure = Query.isModeAggregate(query) && Query.getMeasuresKeys(query).length === 1

  const items: ButtonMenuItem[] = [
    {
      key: 'names',
      checked: nodeDefLabelType === NodeDef.NodeDefLabelTypes.name,
      label: 'common.showNames',
      onClick: onNodeDefLabelTypeChange,
    },
  ]
  if (displayTypeTable) {
    items.push({
      key: 'codes',
      checked: codesVisible,
      label: 'dataView:dataQuery.showCodes',
      onClick: () => dispatch(DataExplorerActions.setCodesVisible(!codesVisible)),
    })
  }
  if (displayTypeTable && singleMeasure) {
    items.push({
      key: 'totals',
      checked: totalsVisible,
      label: 'dataView:dataQuery.showTotalAndPercentage',
      onClick: () => dispatch(DataExplorerActions.setTotalsVisible(!totalsVisible)),
    })
  }

  return (
    <ButtonMenu
      closeMenuOnItemClick={false}
      iconClassName="icon-eye icon-14px"
      items={items}
      label="dataView:dataQuery.viewOptions"
      variant="outlined"
    />
  )
}
