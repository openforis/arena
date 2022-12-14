import './expressionEditor.scss'

import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { TestId } from '@webapp/utils/testId'
import { useI18n } from '@webapp/store/system'

import ExpressionEditorPopup from './expressionEditorPopup'
import { ExpressionEditorType } from './expressionEditorType'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { Button } from '../buttons'

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

  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const [edit, setEdit] = useState(false)

  const onClose = useCallback(() => setEdit(false), [])

  const applyChange = useCallback(
    ({ query }) => {
      if (onChange) {
        onChange({ query, callback: onClose })
      } else {
        onClose()
      }
    },
    [onChange, onClose]
  )

  const idPrefix = `expression-editor-${placeholder ? 'placeholder' : index}-${qualifier}`

  const qualifierLabel = i18n.t(`expressionEditor.qualifier.${qualifier}`)
  const nodeDefCurrent = Survey.getNodeDefByUuid(nodeDefUuidCurrent)(survey)
  const popupHeader = nodeDefCurrent
    ? i18n.t('expressionEditor.header.editingExpressionForNodeDefinition', {
        qualifier: qualifierLabel,
        nodeDef: NodeDef.getLabel(nodeDefCurrent, lang),
      })
    : null

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
          onClose={onClose}
          onChange={applyChange}
          types={types}
          header={popupHeader}
        />
      ) : (
        <div className="expression-editor__query-container">
          {!R.isEmpty(query) && (
            <div className="query" id={`${idPrefix}-query`} data-testid={TestId.expressionEditor.query(qualifier)}>
              {query}
            </div>
          )}
          <Button
            className="btn-s btn-edit"
            iconClassName="icon-pencil2 icon-14px"
            id={`${idPrefix}-edit-btn`}
            onClick={() => setEdit(true)}
            testId={TestId.expressionEditor.editBtn(qualifier)}
          />
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
