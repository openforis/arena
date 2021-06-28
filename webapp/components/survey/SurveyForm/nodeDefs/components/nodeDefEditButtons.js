import './nodeDefEditButtons.scss'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { elementOffset } from '@webapp/utils/domUtils'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { NodeDefsActions } from '@webapp/store/survey'
import { SurveyFormActions, SurveyFormState } from '@webapp/store/ui/surveyForm'
import { DataTestId } from '@webapp/utils/dataTestId'

const NodeDefEditButtons = (props) => {
  const { surveyCycleKey, nodeDef } = props

  const dispatch = useDispatch()

  const elementRef = useRef(null)
  const [style, setStyle] = useState({})

  const i18n = useI18n()

  const hasNodeDefAddChildTo = Boolean(useSelector(SurveyFormState.getNodeDefAddChildTo))

  useEffect(() => {
    const { parentNode } = elementRef.current
    if (parentNode.classList.contains('survey-form__node-def-page')) {
      const right = hasNodeDefAddChildTo ? 225 : 25
      const { top } = elementOffset(parentNode)
      setStyle({ position: 'fixed', top: `${top}px`, right: `${right}px` })
    }
  }, [hasNodeDefAddChildTo])

  return (
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
            onChange={(event) => {
              const value = Number(event.target.value)
              if (value > 0)
                dispatch(
                  NodeDefsActions.putNodeDefLayoutProp({
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
        data-testid={DataTestId.surveyForm.nodeDefEditBtn(NodeDef.getName(nodeDef))}
        className="btn btn-s btn-transparent survey-form__node-def-edit-button"
        to={`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`}
      >
        <span className="icon icon-pencil2 icon-12px" />
      </Link>

      {NodeDef.isEntity(nodeDef) && (
        <button
          type="button"
          data-testid={DataTestId.surveyForm.nodeDefAddChildBtn(NodeDef.getName(nodeDef))}
          className="btn btn-s btn-transparent"
          onClick={() => dispatch(SurveyFormActions.setFormNodeDefAddChildTo(nodeDef))}
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
}

NodeDefEditButtons.propTypes = {
  surveyCycleKey: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
}

export default NodeDefEditButtons
