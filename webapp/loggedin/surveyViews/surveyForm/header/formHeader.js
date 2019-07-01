import React from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import { nodeDefLayoutProps, nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'
import { uuidv4 } from '../../../../../common/uuid'

import FormEntryActions from './formEntryActions'
import FormEditActions from './formEditActions'

import useI18n from '../../../../commonComponents/useI18n'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'
import * as SurveyFormState from '../surveyFormState'

import { createNodeDef } from '../../../../survey/nodeDefs/actions'

const FormHeader = props => {

  const {
    edit, entry, preview,
    history, canEditDef,
    nodeDefPage, nodeDefPageLabel, createNodeDef
  } = props

  const i18n = useI18n()

  return (
    <div className="survey-form-header">
      <div className="survey-form__nav-node-def-navigation">

        <button className="btn btn-s">
          <span className="icon icon-stack icon-12px icon-left"/>
          {i18n.t('surveyForm.showPageNav')}
        </button>

        {
          edit && canEditDef &&
          <button className="btn btn-s icon-right"
                  onClick={() => createNodeDef(
                    NodeDef.getUuid(nodeDefPage),
                    NodeDef.nodeDefType.entity,
                    {
                      [nodeDefLayoutProps.render]: nodeDefRenderType.form,
                      [nodeDefLayoutProps.pageUuid]: uuidv4(),
                    }
                  )}>
            <span className="icon icon-plus icon-12px icon-left"/>
            {nodeDefPageLabel} {i18n.t('surveyForm.nodeDefNavigation.subPage')}
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
  const lang = AppState.getLang(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const nodeDefPageLabel = NodeDef.getLabel(nodeDefPage, Survey.getLanguage(lang)(surveyInfo))

  return {
    nodeDefPage,
    nodeDefPageLabel
  }
}

export default connect(mapStateToProps, { createNodeDef })(FormHeader)