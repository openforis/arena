import './expressionEditorPopup.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import Popup from '../popup'
import { useI18n } from '../hooks'

import {
  useExpressionEditorPopupState,
  useAdvancedExpressionEditorPopupState,
  mapStateToProps,
} from './expressionEditorPopupState'

import AdvancedExpressionEditorPopup from './advancedExpressionEditorPopup'
import BasicExpressionEditorPopup from './basicExpressionEditorPopup'

const ExpressionEditorPopup = props => {
  const { onChange, onClose, hideAdvanced } = props

  const [expressionCanBeApplied, setExpressionCanBeApplied] = useState(false)

  const {
    query,
    queryDraft,
    exprDraft,
    exprDraftValid,
    updateDraft,
    resetDraft,
    advanced,
    setAdvancedEditor,
  } = useExpressionEditorPopupState({ setExpressionCanBeApplied, ...props })

  const advancedEditorState = useAdvancedExpressionEditorPopupState(props)

  const i18n = useI18n()

  let editor
  if (advanced)
    editor = (
      <AdvancedExpressionEditorPopup
        setExpressionCanBeApplied={setExpressionCanBeApplied}
        {...props}
        {...advancedEditorState}
      />
    )
  else
    editor = (
      <BasicExpressionEditorPopup
        query={query}
        queryDraft={queryDraft}
        exprDraft={exprDraft}
        exprDraftValid={exprDraftValid}
        updateDraft={updateDraft}
        {...props}
      />
    )

  const onToggleAdvancedEditor = () => {
    if (advanced) resetDraft()
    setAdvancedEditor(!advanced)
  }

  const onApply = () => {
    // By adding a newline to all onChange() params, we specify that
    // the query was written with this advanced expression editor.
    // With this, we can always open the query (i.e. the expression)
    // in advanced editor directly.
    if (advanced) onChange(advancedEditorState.queryDraft.trimRight() + '\n', advancedEditorState.exprDraft)
    else onChange(queryDraft, exprDraft)
  }

  return (
    <Popup className="expression-editor-popup" onClose={onClose} padding={20}>
      <button
        className="expression-editor-popup__toggle-advanced"
        hidden={hideAdvanced}
        onClick={onToggleAdvancedEditor}
      >
        {advanced ? i18n.t('nodeDefEdit.basic') : i18n.t('nodeDefEdit.advanced')}
      </button>

      {editor}

      <div className="expression-editor-popup__footer">
        <button className="btn btn-xs" onClick={() => onChange('')} aria-disabled={R.isEmpty(query)}>
          <span className="icon icon-undo2 icon-12px" />
          {i18n.t('common.reset')}
        </button>

        <button className="btn btn-xs" onClick={onApply} aria-disabled={!expressionCanBeApplied}>
          <span className="icon icon-checkmark icon-12px" />
          {i18n.t('common.apply')}
        </button>
      </div>
    </Popup>
  )
}

ExpressionEditorPopup.defaultProps = {
  query: '', // String representing the expression
  expr: null, // AST expression
  // NOTE: One of the two above is passed on component creation
  nodeDefUuidContext: '', // Entity
  nodeDefUuidCurrent: null, // Attribute
  mode: Expression.modes.json,
  isContextParent: false,
  canBeConstant: false, // True if expression can be a constant value like a number or a string
  isBoolean: true, // True if expression returns a boolean condition
  hideAdvanced: false,

  literalSearchParams: null,
  onClose: _ => {},
  onChange: _ => {},
}

export default connect(mapStateToProps)(ExpressionEditorPopup)
