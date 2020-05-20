import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as Expression from '@core/expressionParser/expression'

import Tooltip from '@webapp/commonComponents/tooltip'
import ExpressionEditorPopup from '@webapp/commonComponents/expression/expressionEditorPopup'

import { resetTableFilter, updateTableFilter } from '@webapp/loggedin/modules/data/dataVis/dataQuery/actions'

const ButtonFilter = (props) => {
  const { nodeDefUuidContext, filter, editMode } = props

  const dispatch = useDispatch()

  const [showExpressionEditor, setShowExpressionEditor] = useState(false)
  const toggleExpressionEditor = () => {
    setShowExpressionEditor(!showExpressionEditor)
  }

  return (
    <>
      <Tooltip messages={filter && [Expression.toString(filter, Expression.modes.sql)]}>
        <button
          type="button"
          className={`btn btn-s btn-edit${filter ? ' highlight' : ''}`}
          onClick={toggleExpressionEditor}
          aria-disabled={editMode}
        >
          <span className="icon icon-filter icon-14px" />
        </button>
      </Tooltip>

      {showExpressionEditor && (
        <ExpressionEditorPopup
          nodeDefUuidContext={nodeDefUuidContext}
          expr={filter}
          mode={Expression.modes.sql}
          hideAdvanced
          onChange={(_, expr) => {
            if (expr) {
              dispatch(updateTableFilter(expr))
            } else {
              dispatch(resetTableFilter())
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
  nodeDefUuidContext: PropTypes.string.isRequired,
  filter: PropTypes.object,
  editMode: PropTypes.bool.isRequired,
}

ButtonFilter.defaultProps = {
  filter: null,
}

export default ButtonFilter
