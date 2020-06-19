import './sortEditor.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'
import * as DataSort from '@common/surveyRdb/dataSort'

import Popup from '@webapp/components/popup'

import SortRow from './sortRow'
import useSortEditorState from './useSortEditorState'

const SortExpressionComponent = (props) => {
  const { mode, nodeDefUuidContext, nodeDefUuidCols, onChange, onClose, sort } = props

  const {
    addCriteria,
    applyChange,
    availableVariables,
    deleteCriteria,
    onSelectOrder,
    onSelectVariable,
    reset,
    sortCriteria,
    unchosenVariables,
    updated,
  } = useSortEditorState({ mode, nodeDefUuidContext, nodeDefUuidCols, onChange, onClose, sort })

  return (
    <Popup className="sort-editor-popup" onClose={onClose} padding={20}>
      <>
        <div className="sort-editor__criteria">
          {sortCriteria.map((criteria, pos) => (
            <SortRow
              key={criteria.variable}
              variables={unchosenVariables}
              selectedVariable={DataSort.findVariableByValue(criteria.variable)(availableVariables)}
              onSelectVariable={(item) => onSelectVariable(pos, item)}
              selectedOrder={criteria.order}
              onSelectOrder={(order) => onSelectOrder(pos, order)}
              onDelete={() => deleteCriteria(pos)}
              isFirst={!pos}
            />
          ))}

          {unchosenVariables.length > 0 && (
            <SortRow
              variables={unchosenVariables}
              onSelectVariable={(item) => addCriteria(item)}
              isPlaceholder
              isFirst={!sortCriteria.length}
            />
          )}
        </div>
        <div className="sort-editor__footer">
          <button type="button" className="btn btn-xs" onClick={() => reset()} aria-disabled={!sortCriteria.length}>
            <span className="icon icon-undo2 icon-16px" /> Reset
          </button>

          <button type="button" className="btn btn-xs" onClick={() => applyChange()} aria-disabled={!updated}>
            <span className="icon icon-checkmark icon-16px" /> Apply
          </button>
        </div>
      </>
    </Popup>
  )
}

SortExpressionComponent.propTypes = {
  mode: PropTypes.string,
  nodeDefUuidContext: PropTypes.string.isRequired,
  nodeDefUuidCols: PropTypes.arrayOf(String).isRequired,
  onChange: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  sort: PropTypes.arrayOf(Object).isRequired,
}

SortExpressionComponent.defaultProps = {
  mode: Expression.modes.sql,
  onChange: null,
}

export default SortExpressionComponent
