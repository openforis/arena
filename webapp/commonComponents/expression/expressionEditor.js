import './expressionEditor.scss'

import React, { useState } from 'react'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import ExpressionEditorPopup from './expressionEditorPopup'

const ExpressionEditor = props => {
  const {
    query,
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    mode,
    isContextParent,
    canBeConstant,
    isBoolean,
    onChange,
    hideAdvanced,
  } = props

  const [edit, setEdit] = useState(false)

  const applyChange = query => {
    if (onChange) onChange(query)
    setEdit(false)
  }

  return (
    <div className="expression-editor">
      {edit ? (
        <ExpressionEditorPopup
          query={query}
          nodeDefUuidContext={nodeDefUuidContext}
          nodeDefUuidCurrent={nodeDefUuidCurrent}
          mode={mode}
          isContextParent={isContextParent}
          canBeConstant={canBeConstant}
          isBoolean={isBoolean}
          onClose={() => setEdit(false)}
          onChange={query => applyChange(query)}
          hideAdvanced={hideAdvanced}
        />
      ) : (
        <div className="expression-editor__query-container">
          {!R.isEmpty(query) && <div className="query">{query}</div>}
          <button className="btn btn-s btn-edit" onClick={() => setEdit(true)}>
            <span className="icon icon-pencil2 icon-14px" />
          </button>
        </div>
      )}
    </div>
  )
}

ExpressionEditor.defaultProps = {
  query: '',
  nodeDefUuidContext: '',
  nodeDefUuidCurrent: null,
  mode: Expression.modes.json,
  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,

  onChange: _ => {},
}

export default ExpressionEditor
