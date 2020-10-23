import React from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'

import Tooltip from '@webapp/components/tooltip'
import ExpressionEditorPopup from '@webapp/components/expression/expressionEditorPopup'
import { ExpressionEditorType } from '@webapp/components/expression/expressionEditorType'

import { State } from '../store'

const ButtonFilter = (props) => {
  const { disabled, query, onChangeQuery, state, Actions } = props
  const entityDefUuid = Query.getEntityDefUuid(query)
  const filter = Query.getFilter(query)

  return (
    <>
      <Tooltip messages={filter && [Expression.toString(filter, Expression.modes.sql)]}>
        <button
          type="button"
          className={`btn btn-s btn-edit${filter ? ' highlight' : ''}`}
          onClick={Actions.togglePanelFilter}
          aria-disabled={disabled}
        >
          <span className="icon icon-filter icon-14px" />
        </button>
      </Tooltip>

      {State.showPanelFilter(state) && (
        <ExpressionEditorPopup
          nodeDefUuidContext={entityDefUuid}
          query={filter ? Expression.toString(filter) : ''}
          mode={Expression.modes.sql}
          type={[ExpressionEditorType.basic]}
          onChange={(_, expr) => {
            onChangeQuery(Query.assocFilter(expr))
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
  query: PropTypes.object.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default ButtonFilter
