import { useState } from 'react'

import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'

import { Button, ButtonIconClose } from '@webapp/components/buttons'
import ExpressionEditorPopup from '@webapp/components/expression/expressionEditorPopup'
import * as ExpressionParser from '@webapp/components/expression/expressionParser'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'

import { QuerySidebarSection } from './QuerySidebarSection'

type Props = {
  disabled: boolean
}

/**
 * Sidebar section showing the records filter as a readable expression; it opens the expression editor.
 * @param {Props} props - The component props.
 * @returns {React.ReactElement} - The filter section.
 */
export const QueryFilterSection = (props: Props) => {
  const { disabled } = props

  const query = DataExplorerSelectors.useQuery()
  const onChangeQuery = DataExplorerHooks.useSetQuery()
  const [editorOpen, setEditorOpen] = useState(false)

  const entityDefUuid = Query.getEntityDefUuid(query)
  const filter = Query.getFilter(query)

  return (
    <QuerySidebarSection label="dataView:filterRecords.buttonTitle">
      {filter ? (
        <div className="query-sidebar__condition">
          <Button
            className="query-sidebar__condition-text query-sidebar__condition-text--expression"
            disabled={disabled}
            label={Expression.toString(filter)}
            labelIsI18nKey={false}
            onClick={() => setEditorOpen(true)}
            title="common.edit"
            variant="text"
          />
          <ButtonIconClose
            className="btn-s btn-transparent"
            disabled={disabled}
            onClick={() => onChangeQuery(Query.assocFilter(null)(query))}
            title="dataView:dataQuery.sidebar.removeFilter"
          />
        </div>
      ) : (
        <Button
          className="query-sidebar__btn-add"
          disabled={disabled}
          iconClassName="icon-plus icon-10px"
          label="dataView:dataQuery.sidebar.addFilter"
          onClick={() => setEditorOpen(true)}
          size="small"
          variant="text"
        />
      )}

      {editorOpen && (
        <ExpressionEditorPopup
          canBeCall
          nodeDefUuidContext={entityDefUuid}
          nodeDefUuidCurrent={entityDefUuid}
          includeAnalysis
          isContextParent={false}
          excludeCurrentNodeDef={false}
          query={filter ? Expression.toString(filter) : ''}
          mode={Expression.modes.sql}
          textSearchHelpVisible
          header="dataView:filterRecords.expressionEditorHeader"
          onChange={({ expr }) => {
            const exprNormalized = ExpressionParser.normalize({ expr, canBeCall: true })
            onChangeQuery(Query.assocFilter(exprNormalized)(query))
            setEditorOpen(false)
          }}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </QuerySidebarSection>
  )
}
