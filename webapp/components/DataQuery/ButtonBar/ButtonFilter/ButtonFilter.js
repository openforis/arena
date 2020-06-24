import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'
import { Query } from '@common/model/query'

import Tooltip from '@webapp/components/tooltip'
import ExpressionEditorPopup from '@webapp/components/expression/expressionEditorPopup'

const ButtonFilter = (props) => {
  const { disabled, query } = props
  const entityDefUuid = Query.getNodeDefUuidTable(query)
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
          expr={filter}
          mode={Expression.modes.sql}
          hideAdvanced
          onChange={(_, expr) => {
            if (expr) {
              // TODO: dispatch(updateTableFilter(expr))
            } else {
              // TODO: dispatch(resetTableFilter())
            }

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
}

export default ButtonFilter
