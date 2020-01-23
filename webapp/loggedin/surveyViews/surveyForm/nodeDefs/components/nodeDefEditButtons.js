import './nodeDefEditButtons.scss'

import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import { useI18n } from '@webapp/commonComponents/hooks'
import { elementOffset } from '@webapp/utils/domUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as SurveyFormState from '@webapp/loggedin/surveyViews/surveyForm/surveyFormState'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { putNodeDefLayoutProp, removeNodeDef } from '@webapp/survey/nodeDefs/actions'
import { setFormNodeDefAddChildTo } from '@webapp/loggedin/surveyViews/surveyForm/actions'

const NodeDefEditButtons = props => {
  const {
    surveyCycleKey,
    nodeDef,
    edit,
    canEditDef,
    hasNodeDefAddChildTo,
    putNodeDefLayoutProp,
    setFormNodeDefAddChildTo,
    removeNodeDef,
  } = props

  const show = edit && canEditDef
  const elementRef = useRef(null)
  const [style, setStyle] = useState({})

  const i18n = useI18n()

  useEffect(() => {
    if (show) {
      const { parentNode } = elementRef.current
      if (parentNode.classList.contains('survey-form__node-def-page')) {
        const right = hasNodeDefAddChildTo ? 225 : 25
        const { top } = elementOffset(parentNode)
        setStyle({ position: 'fixed', top: `${top}px`, right: `${right}px` })
      }
    }
  }, [hasNodeDefAddChildTo])

  return (
    show && (
      <div className="survey-form__node-def-edit-buttons" ref={elementRef} style={style}>
        {NodeDefLayout.hasPage(surveyCycleKey)(nodeDef) && (
          <div className="survey-form__node-def-edit-page-props">
            {i18n.t('surveyForm.nodeDefEditFormActions.columns')}
            <input
              value={NodeDefLayout.getColumnsNo(surveyCycleKey)(nodeDef)}
              type="number"
              min="1"
              max="12"
              step="1"
              onChange={e =>
                e.target.value > 0
                  ? putNodeDefLayoutProp(nodeDef, NodeDefLayout.keys.columnsNo, Number(e.target.value))
                  : null
              }
            />
          </div>
        )}

        <Link
          className="btn btn-s btn-transparent"
          to={`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`}
        >
          <span className="icon icon-pencil2 icon-12px" />
        </Link>

        {NodeDef.isEntity(nodeDef) && (
          <button
            className="btn btn-s btn-transparent"
            onClick={() => setFormNodeDefAddChildTo(nodeDef)}
            onMouseDown={e => {
              e.stopPropagation()
            }}
          >
            <span className="icon icon-plus icon-12px" />
          </button>
        )}

        {!NodeDef.isRoot(nodeDef) && (
          <button
            className="btn btn-s btn-transparent"
            onClick={() => removeNodeDef(nodeDef)}
            onMouseDown={e => {
              e.stopPropagation()
            }}
          >
            <span className="icon icon-bin2 icon-12px" />
          </button>
        )}
      </div>
    )
  )
}

const mapStateToProps = state => ({
  hasNodeDefAddChildTo: Boolean(SurveyFormState.getNodeDefAddChildTo(state)),
})

export default connect(mapStateToProps, {
  setFormNodeDefAddChildTo,
  putNodeDefLayoutProp,
  removeNodeDef,
})(NodeDefEditButtons)
