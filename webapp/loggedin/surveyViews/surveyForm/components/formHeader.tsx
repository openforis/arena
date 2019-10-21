import './formHeader.scss'

import React from 'react'
import { connect } from 'react-redux'

import { useI18n } from '../../../../commonComponents/hooks'

import NodeDef from '../../../../../core/survey/nodeDef'
import NodeDefLayout from '../../../../../core/survey/nodeDefLayout'
import { uuidv4 } from '../../../../../core/uuid'

import FormEntryActions from './formEntryActions'
import FormEditActions from './formEditActions'

import * as SurveyState from '../../../../survey/surveyState'
import * as SurveyFormState from '../surveyFormState'

import { createNodeDef } from '../../../../survey/nodeDefs/actions'

const FormHeader = props => {

  const {
    surveyCycleKey, edit, entry, preview,
    history, canEditDef,
    nodeDefPage, nodeDefPageLabel,
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
  { createNodeDef }
)(FormHeader)
