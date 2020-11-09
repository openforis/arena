import './formHeader.scss'

import React from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import { uuidv4 } from '@core/uuid'

import { useI18n } from '@webapp/store/system'
import { SurveyState, NodeDefsActions } from '@webapp/store/survey'
import { SurveyFormActions, SurveyFormState } from '@webapp/store/ui/surveyForm'

import FormEntryActions from './formEntryActions'
import FormEditActions from './formEditActions'

const FormHeader = (props) => {
  const {
    surveyCycleKey,
    edit,
    entry,
    preview,
    canEditDef,
    nodeDefPage,
    nodeDefPageLabel,
    showPageNavigation,
    toggleFormPageNavigation,
    createNodeDef,
    ItemLabelFunctionSelector,
  } = props

  const i18n = useI18n()
  const history = useHistory()

  return (
    <div className="survey-form-header">
      <div className="survey-form-header__label-container">
        <button
          className="btn-s survey-form-header__btn-page-toggle"
          onClick={toggleFormPageNavigation}
          title={i18n.t(`surveyForm.${showPageNavigation ? 'hide' : 'show'}Pages`)}
        >
          <span className="icon icon-stack icon-12px icon-left" />
          <span className={`icon icon-${showPageNavigation ? 'shrink2' : 'enlarge2'} icon-12px icon-left`} />
        </button>

        <h5 id="survey-form-page-label">{nodeDefPageLabel}</h5>

        {edit && canEditDef && (
          <button
            className="btn-s btn-transparent btn-add-sub-page"
            onClick={() =>
              createNodeDef(
                nodeDefPage,
                NodeDef.nodeDefType.entity,
                {
                  [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(
                    surveyCycleKey,
                    NodeDefLayout.renderType.form,
                    uuidv4()
                  ),
                },
                history
              )
            }
          >
            <span className="icon icon-plus icon-10px icon-left" />
            {i18n.t('surveyForm.subPage')}
          </button>
        )}
      </div>

      <div className="survey-form-header__options">{ItemLabelFunctionSelector && <ItemLabelFunctionSelector />}</div>
      {edit && canEditDef ? <FormEditActions /> : <FormEntryActions preview={preview} entry={entry} />}
    </div>
  )
}

const mapStateToProps = (state) => {
  const nodeDefPage = SurveyFormState.getFormActivePageNodeDef(state)
  const nodeDefPageLabel = SurveyState.getNodeDefLabel(nodeDefPage)(state)
  const showPageNavigation = SurveyFormState.showPageNavigation(state)

  return {
    nodeDefPage,
    nodeDefPageLabel,
    showPageNavigation,
  }
}

export default connect(mapStateToProps, {
  toggleFormPageNavigation: SurveyFormActions.toggleFormPageNavigation,
  createNodeDef: NodeDefsActions.createNodeDef,
})(FormHeader)
