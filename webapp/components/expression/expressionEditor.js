import './expressionEditor.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import { DataTestId } from '@webapp/utils/dataTestId'

import ExpressionEditorPopup from './expressionEditorPopup'
import { ExpressionEditorType } from './expressionEditorType'

const ExpressionEditor = (props) => {
  const {
    index,
    qualifier,
    placeholder,
    query,
    nodeDefUuidContext,
    nodeDefUuidCurrent,
    excludeCurrentNodeDef,
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

  const idPrefix = `expression-editor-${placeholder ? 'placeholder' : index}-${qualifier}`

  return (
    <div className="expression-editor">
      {edit ? (
        <ExpressionEditorPopup
          qualifier={qualifier}
          query={query}
          nodeDefUuidContext={nodeDefUuidContext}
          nodeDefUuidCurrent={nodeDefUuidCurrent}
          excludeCurrentNodeDef={excludeCurrentNodeDef}
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
          {!R.isEmpty(query) && (
            <div className="query" id={`${idPrefix}-query`} data-testid={DataTestId.expressionEditor.query(qualifier)}>
              {query}
            </div>
          )}
          <button
            type="button"
            className="btn btn-s btn-edit"
            id={`${idPrefix}-edit-btn`}
            data-testid={DataTestId.expressionEditor.editBtn(qualifier)}
            onClick={() => setEdit(true)}
          >
            <span className="icon icon-pencil2 icon-14px" />
          </button>
        </div>
      )}
    </div>
  )
}

ExpressionEditor.propTypes = {
  index: PropTypes.number, // used when rendering multiple expression editor elements
  qualifier: PropTypes.string.isRequired, // used to generate test ids
  placeholder: PropTypes.bool, // true if the element is a placeholder
  query: PropTypes.string, // String representing the expression
  nodeDefUuidContext: PropTypes.string, // Entity
  nodeDefUuidCurrent: PropTypes.string, // Attribute
  excludeCurrentNodeDef: PropTypes.bool,
  mode: PropTypes.oneOf([Expression.modes.json, Expression.modes.sql]),
  types: PropTypes.arrayOf(PropTypes.oneOf([ExpressionEditorType.basic, ExpressionEditorType.advanced])), // allowed expression types
  isContextParent: PropTypes.bool,
  canBeConstant: PropTypes.bool,
  isBoolean: PropTypes.bool,
  onChange: PropTypes.func,
}

ExpressionEditor.defaultProps = {
  index: 0,
  placeholder: false,
  query: '',
  nodeDefUuidContext: '',
  nodeDefUuidCurrent: null,
  excludeCurrentNodeDef: true,
  mode: Expression.modes.json,
  types: [ExpressionEditorType.basic, ExpressionEditorType.advanced],
  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,

  onChange: () => {},
}

export default ExpressionEditor
