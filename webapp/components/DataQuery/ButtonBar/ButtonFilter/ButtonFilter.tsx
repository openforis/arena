import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'

import { ButtonIconFilter } from '@webapp/components/buttons'
import ExpressionEditorPopup from '@webapp/components/expression/ExpressionEditorPopup'
import * as ExpressionParser from '@webapp/components/expression/expressionParser'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'

import { State } from '../store'

type ButtonFilterProps = {
  disabled: boolean
  state: Record<string, any>
  Actions: Record<string, any>
}

const ButtonFilter = (props: ButtonFilterProps) => {
  const { disabled, state, Actions } = props

  const query = DataExplorerSelectors.useQuery()
  const onChangeQuery = DataExplorerHooks.useSetQuery()

  const entityDefUuid = Query.getEntityDefUuid(query)
  const filter = Query.getFilter(query)

  return (
    <>
      <ButtonIconFilter
        className={`btn btn-edit${filter ? ' highlight' : ''}`}
        disabled={disabled}
        onClick={Actions.togglePanelFilter}
        label="dataView:filterRecords.buttonTitle"
        title={filter ? Expression.toString(filter, Expression.modes.sql) : undefined}
        variant="outlined"
      />

      {State.isPanelFilterShown(state) && (
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
            Actions.closePanels()
          }}
          onClose={Actions.closePanels}
        />
      )}
    </>
  )
}

export default ButtonFilter
