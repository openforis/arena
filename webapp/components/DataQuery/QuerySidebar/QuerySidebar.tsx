import './QuerySidebar.scss'

import { Query } from '@common/model/query'

import { ButtonGroup } from '@webapp/components/form'

import { useIsAppSaving } from '@webapp/store/app'
import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'

import QueryNodeDefsSelector from '../QueryNodeDefsSelector'

const { modes } = Query

const modeButtonItems = [
  { key: modes.raw, iconClassName: 'icon-file-text2', label: 'dataView:dataQuery.mode.raw' },
  { key: modes.aggregate, iconClassName: 'icon-sigma', label: 'dataView:dataQuery.mode.aggregate' },
]

// raw edit mode shown as "raw" in the mode button group
const uiModeByQueryMode = {
  [modes.raw]: modes.raw,
  [modes.rawEdit]: modes.raw,
  [modes.aggregate]: modes.aggregate,
}

type Props = {
  nodeDefLabelType: string
}

/**
 * Left panel: query mode (raw / aggregate) on top of the entity and variables selector.
 * @param {Props} props - The component props.
 * @returns {React.ReactElement} - The sidebar element.
 */
export const QuerySidebar = (props: Props) => {
  const { nodeDefLabelType } = props

  const appSaving = useIsAppSaving()
  const query = DataExplorerSelectors.useQuery()
  const onChangeQuery = DataExplorerHooks.useSetQuery()

  return (
    <aside className="query-sidebar">
      <ButtonGroup
        className="query-sidebar__mode"
        disabled={appSaving}
        groupName="queryMode"
        selectedItemKey={uiModeByQueryMode[Query.getMode(query)]}
        onChange={(mode: string) => onChangeQuery(Query.assocMode(mode)(query))}
        items={modeButtonItems}
      />
      <QueryNodeDefsSelector nodeDefLabelType={nodeDefLabelType} />
    </aside>
  )
}
