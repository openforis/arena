import './nodeDefEditButtons.scss'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { elementOffset } from '@webapp/utils/domUtils'
import { TestId } from '@webapp/utils/testId'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { NodeDefsActions } from '@webapp/store/survey'
import { SurveyFormActions, SurveyFormState } from '@webapp/store/ui/surveyForm'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { Button } from '@webapp/components'

import { NodeDefEditButtonsMenu } from './nodeDefEditButtonsMenu'

const NodeDefEditButtons = (props) => {
  const { surveyCycleKey, nodeDef } = props

  const dispatch = useDispatch()

  const elementRef = useRef(null)
  const [style, setStyle] = useState({})

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const hasNodeDefAddChildTo = Boolean(useSelector(SurveyFormState.getNodeDefAddChildTo))
  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)

  useEffect(() => {
    const { parentNode } = elementRef.current
    if (parentNode.classList.contains('survey-form__node-def-page')) {
      const right = hasNodeDefAddChildTo ? 225 : 25
      const { top } = elementOffset(parentNode)
      setStyle({ position: 'fixed', top: `${top}px`, right: `${right}px` })
    }
  }, [hasNodeDefAddChildTo])

  return (
    <div
      className="survey-form__node-def-edit-buttons"
      ref={elementRef}
      style={style}
      draggable={false}
      onMouseDown={(e) => e.stopPropagation()}
    >
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
        data-testid={TestId.surveyForm.nodeDefEditBtn(nodeDefName)}
        className="btn btn-s btn-transparent survey-form__node-def-edit-button"
        to={`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`}
        title={i18n.t('surveyForm.edit', { nodeDefLabel })}
      >
        <span className="icon icon-pencil2 icon-16px" />
      </Link>

      <NodeDefEditButtonsMenu nodeDef={nodeDef} />

      {NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef) && (
        <Button
          className="btn-s btn-transparent"
          onClick={() => dispatch(NodeDefsActions.compressFormItems(nodeDef))}
          onMouseDown={(e) => e.stopPropagation()}
          iconClassName="icon-stack"
          title="surveyForm.compressFormItems"
          titleParams={{ nodeDefLabel }}
        />
      )}

      {NodeDef.isEntity(nodeDef) && (
        <Button
          testId={TestId.surveyForm.nodeDefAddChildToBtn(nodeDefName)}
          className="btn-s btn-transparent"
          onClick={() => dispatch(SurveyFormActions.setFormNodeDefAddChildTo(nodeDef))}
          onMouseDown={(e) => e.stopPropagation()}
          iconClassName="icon-plus icon-12px"
          title="surveyForm.addChildToTitle"
          titleParams={{ nodeDefLabel }}
        />
      )}
    </div>
  )
}

NodeDefEditButtons.propTypes = {
  surveyCycleKey: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
}

export default NodeDefEditButtons
