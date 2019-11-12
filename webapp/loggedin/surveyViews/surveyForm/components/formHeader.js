import './formHeader.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import { uuidv4 } from '@core/uuid'

import { useI18n } from '@webapp/commonComponents/hooks'
import FormEntryActions from './formEntryActions'
import FormEditActions from './formEditActions'

import * as SurveyState from '@webapp/survey/surveyState'
import * as SurveyFormState from '../surveyFormState'

import { toggleFormPageNavigation } from '../../surveyForm/actions'
import { createNodeDef } from '@webapp/survey/nodeDefs/actions'

const FormHeader = props => {

  const {
    surveyCycleKey, edit, entry, preview,
    history, canEditDef,
    nodeDefPage, nodeDefPageLabel,
    showPageNavigation,
    toggleFormPageNavigation, createNodeDef,
  } = props

  const i18n = useI18n()

  return (
    <div className="survey-form-header">
      <div className="survey-form-header__label-container">

        <button className="btn-s survey-form-header__btn-page-toggle"
                onClick={toggleFormPageNavigation}
                title={i18n.t(`surveyForm.${showPageNavigation ? 'hide' : 'show'}Pages`)}>
          <span className="icon icon-stack icon-12px icon-left"/>
          <span className={`icon icon-${showPageNavigation ? 'shrink2' : 'enlarge2'} icon-12px icon-left`}/>
        </button>

        <h5>{nodeDefPageLabel}</h5>

        {
          edit && canEditDef &&
          <button className="btn-s btn-transparent btn-add-sub-page"
                  onClick={() => createNodeDef(
                    NodeDef.getUuid(nodeDefPage),
                    NodeDef.nodeDefType.entity,
                    {
                      [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(
                        surveyCycleKey,
                        NodeDefLayout.renderType.form,
                        uuidv4()
                      )
                    }
                  )}>
            <span className="icon icon-plus icon-10px icon-left"/>
            {i18n.t('surveyForm.subPage')}
          </button>
        }

      </div>

      {
        edit && canEditDef
          ? <FormEditActions/>
          : <FormEntryActions preview={preview} history={history} entry={entry}/>
      }
    </div>
  )
}

const mapStateToProps = state => {
  const nodeDefPage = SurveyFormState.getFormActivePageNodeDef(state)
  const nodeDefPageLabel = SurveyState.getNodeDefLabel(nodeDefPage)(state)
  const showPageNavigation = SurveyFormState.showPageNavigation(state)

  return {
    nodeDefPage,
    nodeDefPageLabel,
    showPageNavigation
  }
}

export default connect(
  mapStateToProps,
  { toggleFormPageNavigation, createNodeDef }
)(FormHeader)