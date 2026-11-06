import './QuerySidebar.scss'

import { Query } from '@common/model/query'

import { ButtonGroup } from '@webapp/components/form'

import { useIsAppSaving } from '@webapp/store/app'
import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'

import QueryNodeDefsSelector from '../QueryNodeDefsSelector'
import { QueryFilterSection } from './QueryFilterSection'
import { QuerySortSection } from './QuerySortSection'

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
  dataLoaded: boolean
  dataLoading: boolean
  nodeDefLabelType: string
}

/**
 * Left panel with the query definition, top to bottom: mode, entity, filter, sort, variables tree.
 * @param {Props} props - The component props.
 * @returns {React.ReactElement} - The sidebar element.
 */
export const QuerySidebar = (props: Props) => {
  const { dataLoaded, dataLoading, nodeDefLabelType } = props

  const appSaving = useIsAppSaving()
  const query = DataExplorerSelectors.useQuery()
  const onChangeQuery = DataExplorerHooks.useSetQuery()

  const modeEdit = Query.isModeRawEdit(query)
  const queryChangeDisabled = modeEdit || !dataLoaded || dataLoading

  const header = Query.hasSelection(query) ? (
    <div className="query-sidebar__query">
      <QueryFilterSection disabled={queryChangeDisabled} />
      <QuerySortSection disabled={queryChangeDisabled} />
    </div>
  ) : null

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
      <QueryNodeDefsSelector header={header} nodeDefLabelType={nodeDefLabelType} />
    </aside>
  )
}
