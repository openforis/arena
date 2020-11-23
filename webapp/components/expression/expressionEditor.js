import './expressionEditor.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import ExpressionEditorPopup from './expressionEditorPopup'
import { ExpressionEditorType } from './expressionEditorType'

const ExpressionEditor = (props) => {
  const {
    query,
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    mode,
    isContextParent,
    canBeConstant,
    isBoolean,
    onChange,
    types,
  } = props

  const [edit, setEdit] = useState(false)

  const applyChange = (_query) => {
    if (onChange) onChange(_query)
    setEdit(false)
  }

  return (
    <div className="expression-editor">
      {edit ? (
        <ExpressionEditorPopup
          query={query}
          nodeDefUuidContext={nodeDefUuidContext}
          x
          nodeDefUuidCurrent={nodeDefUuidCurrent}
          mode={mode}
          isContextParent={isContextParent}
          canBeConstant={canBeConstant}
          isBoolean={isBoolean}
          onClose={() => setEdit(false)}
          onChange={applyChange}
          types={types}
        />
      ) : (
        <div className="expression-editor__query-container">
          {!R.isEmpty(query) && <div className="query">{query}</div>}
          <button type="button" className="btn btn-s btn-edit" onClick={() => setEdit(true)}>
            <span className="icon icon-pencil2 icon-14px" />
          </button>
        </div>
      )}
    </div>
  )
}

ExpressionEditor.propTypes = {
  query: PropTypes.string, // String representing the expression
  nodeDefUuidContext: PropTypes.string, // Entity
  nodeDefUuidCurrent: PropTypes.string, // Attribute
  mode: PropTypes.oneOf([Expression.modes.json, Expression.modes.sql]),
  types: PropTypes.arrayOf(PropTypes.oneOf([ExpressionEditorType.basic, ExpressionEditorType.advanced])), // allowed expression types
  isContextParent: PropTypes.bool,
  canBeConstant: PropTypes.bool,
  isBoolean: PropTypes.bool,
  onChange: PropTypes.func,
}

ExpressionEditor.defaultProps = {
  query: '',
  nodeDefUuidContext: '',
  nodeDefUuidCurrent: null,
  mode: Expression.modes.json,
  types: [ExpressionEditorType.basic, ExpressionEditorType.advanced],
  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,

  onChange: () => {},
}

export default ExpressionEditor
