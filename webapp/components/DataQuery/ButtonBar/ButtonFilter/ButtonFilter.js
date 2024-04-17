import React from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'

import { ButtonIconFilter } from '@webapp/components/buttons'
import ExpressionEditorPopup from '@webapp/components/expression/expressionEditorPopup'
import { ExpressionEditorType } from '@webapp/components/expression/expressionEditorType'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useI18n } from '@webapp/store/system'

import { State } from '../store'

const ButtonFilter = (props) => {
  const { disabled, state, Actions } = props

  const i18n = useI18n()
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
        label="dataView.filterRecords.buttonTitle"
        title={filter ? Expression.toString(filter, Expression.modes.sql) : undefined}
      />

      {State.isPanelFilterShown(state) && (
        <ExpressionEditorPopup
          nodeDefUuidContext={entityDefUuid}
          query={filter ? Expression.toString(filter) : ''}
          mode={Expression.modes.sql}
          types={[ExpressionEditorType.basic]}
          header={i18n.t('dataView.filterRecords.expressionEditorHeader')}
          onChange={({ expr }) => {
            onChangeQuery(Query.assocFilter(expr)(query))
            Actions.closePanels()
          }}
          onClose={Actions.closePanels}
        />
      )}
    </>
  )
}

ButtonFilter.propTypes = {
  disabled: PropTypes.bool.isRequired,
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ButtonFilter
