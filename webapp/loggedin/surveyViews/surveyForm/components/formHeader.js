import './formHeader.scss'

import React from 'react'
import { connect } from 'react-redux'

import NodeDef from '../../../../../common/survey/nodeDef'
import NodeDefLayout from '../../../../../common/survey/nodeDefLayout'
import { uuidv4 } from '../../../../../common/uuid'

import FormEntryActions from './formEntryActions'
import FormEditActions from './formEditActions'
import useI18n from '../../../../commonComponents/useI18n'

import * as SurveyState from '../../../../survey/surveyState'
import * as SurveyFormState from '../surveyFormState'

import { createNodeDef } from '../../../../survey/nodeDefs/actions'

const FormHeader = props => {

  const {
    edit, entry, preview,
    history, canEditDef,
    nodeDefPage, nodeDefPageLabel,
    showPageNavigation,
    createNodeDef,
  } = props

  const i18n = useI18n()

  return (
    <div className="survey-form-header">
      <div className="survey-form-header__label-container">

        <h5>{nodeDefPageLabel}</h5>

        {
          edit && canEditDef &&
          <button className="btn-s btn-transparent btn-add-sub-page"
                  onClick={() => createNodeDef(
                    NodeDef.getUuid(nodeDefPage),
                    NodeDef.nodeDefType.entity,
                    {
                      [NodeDefLayout.nodeDefLayoutProps.render]: NodeDefLayout.nodeDefRenderType.form,
                      [NodeDefLayout.nodeDefLayoutProps.pageUuid]: uuidv4(),
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
  { createNodeDef }
)(FormHeader)