import './formHeader.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import { dispatchWindowResize } from '../../../../utils/domUtils'

import NodeDef from '../../../../../common/survey/nodeDef'
import { nodeDefLayoutProps, nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'
import { uuidv4 } from '../../../../../common/uuid'

import FormEntryActions from './formEntryActions'
import FormEditActions from './formEditActions'

import useI18n from '../../../../commonComponents/useI18n'

import * as SurveyState from '../../../../survey/surveyState'
import * as SurveyFormState from '../surveyFormState'

import { createNodeDef } from '../../../../survey/nodeDefs/actions'
import { toggleFormPageNavigation } from '../actions'

const FormHeader = props => {

  const {
    edit, entry, preview,
    history, canEditDef,
    nodeDefPage, nodeDefPageLabel,
    showPageNavigation,
    createNodeDef, toggleFormPageNavigation,
  } = props

  const i18n = useI18n()

  //if showPageNavigation changes, trigger window resize to rerender form
  useEffect(() => {
    const reactGridLayoutElems = document.getElementsByClassName('react-grid-layout')
    for (const el of reactGridLayoutElems) {
      el.classList.remove('mounted')
    }
    dispatchWindowResize()
    setTimeout(() => {
      for (const el of reactGridLayoutElems) {
        el.classList.add('mounted')
      }
    }, 100)
  }, [showPageNavigation])

  return (
    <div className="survey-form-header">
      <div className="survey-form-header__label-container">

        <button className="btn btn-s"
                onClick={toggleFormPageNavigation}>
          <span className="icon icon-stack icon-12px icon-left"/>
          {i18n.t(`surveyForm.${showPageNavigation ? 'hidePageNav' : 'showPageNav'}`)}
        </button>

        <div className="survey-form-header__node-def-label">
          {nodeDefPageLabel}
        </div>

        {
          edit && canEditDef &&
          <button className="btn btn-s btn-add-sub-page icon-right"
                  onClick={() => createNodeDef(
                    NodeDef.getUuid(nodeDefPage),
                    NodeDef.nodeDefType.entity,
                    {
                      [nodeDefLayoutProps.render]: nodeDefRenderType.form,
                      [nodeDefLayoutProps.pageUuid]: uuidv4(),
                    }
                  )}>
            <span className="icon icon-plus icon-12px icon-left"/>
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
  { createNodeDef, toggleFormPageNavigation }
)(FormHeader)