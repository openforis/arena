import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'

import Tooltip from '@webapp/components/tooltip'
import ExpressionEditorPopup from '@webapp/components/expression/expressionEditorPopup'

const ButtonFilter = (props) => {
  const { disabled, query, onChangeQuery } = props
  const entityDefUuid = Query.getEntityDefUuid(query)
  const filter = Query.getFilter(query)

  const [showExpressionEditor, setShowExpressionEditor] = useState(false)
  const toggleExpressionEditor = () => setShowExpressionEditor(!showExpressionEditor)

  return (
    <>
      <Tooltip messages={filter && [Expression.toString(filter, Expression.modes.sql)]}>
        <button
          type="button"
          className={`btn btn-s btn-edit${filter ? ' highlight' : ''}`}
          onClick={toggleExpressionEditor}
          aria-disabled={disabled}
        >
          <span className="icon icon-filter icon-14px" />
        </button>
      </Tooltip>

      {showExpressionEditor && (
        <ExpressionEditorPopup
          nodeDefUuidContext={entityDefUuid}
          query={filter ? Expression.toString(filter) : ''}
          mode={Expression.modes.sql}
          hideAdvanced
          onChange={(_, expr) => {
            onChangeQuery(Query.assocFilter(expr))
            toggleExpressionEditor()
          }}
          onClose={toggleExpressionEditor}
        />
      )}
    </>
  )
}

ButtonFilter.propTypes = {
  disabled: PropTypes.bool.isRequired,
  query: PropTypes.object.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
}

export default ButtonFilter
