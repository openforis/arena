import './nodeDefEditButtons.scss'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import { useI18n } from '@webapp/store/system'
import { elementOffset } from '@webapp/utils/domUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as SurveyFormState from '@webapp/loggedin/surveyViews/surveyForm/surveyFormState'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { NodeDefsActions } from '@webapp/store/survey'
import { setFormNodeDefAddChildTo } from '@webapp/loggedin/surveyViews/surveyForm/actions'
import { useActions } from '@webapp/views/App/views/NodeDef/NodeDefEdit/store/actions'

const NodeDefEditButtons = (props) => {
  const { surveyCycleKey, nodeDef, edit, canEditDef } = props

  const dispatch = useDispatch()

  const show = edit && canEditDef
  const elementRef = useRef(null)
  const [style, setStyle] = useState({})

  const i18n = useI18n()

  const hasNodeDefAddChildTo = Boolean(useSelector(SurveyFormState.getNodeDefAddChildTo))

  const { putNodeDefLayoutProp } = useActions({})

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
              onChange={(e) => {
                const value = Number(e.target.value)
                if (value > 0)
                  dispatch(
                    putNodeDefLayoutProp({
                      nodeDef,
                      key: NodeDefLayout.keys.columnsNo,
                      value,
                    })
                  )
              }}
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
            type="button"
            className="btn btn-s btn-transparent"
            onClick={() => dispatch(setFormNodeDefAddChildTo(nodeDef))}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
          >
            <span className="icon icon-plus icon-12px" />
          </button>
        )}

        {!NodeDef.isRoot(nodeDef) && (
          <button
            type="button"
            className="btn btn-s btn-transparent"
            onClick={() => dispatch(NodeDefsActions.removeNodeDef(nodeDef))}
            onMouseDown={(e) => {
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

NodeDefEditButtons.propTypes = {
  surveyCycleKey: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  edit: PropTypes.bool.isRequired,
  canEditDef: PropTypes.bool.isRequired,
}

export default NodeDefEditButtons
