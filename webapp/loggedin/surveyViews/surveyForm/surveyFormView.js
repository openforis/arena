import './surveyFormView.scss'
import './react-grid-layout.scss'

import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

import { useOnUpdate } from '@webapp/commonComponents/hooks'
import * as SideBarState from '@webapp/loggedin/appSideBar/appSidebarState'
import * as SurveyState from '@webapp/survey/surveyState'
import { dispatchWindowResize } from '@webapp/utils/domUtils'
import NodeDefEdit from '../nodeDefEdit/nodeDefEdit'
import * as RecordState from '../record/recordState'
import FormHeader from './components/formHeader'
import FormPageNavigation from './components/formPageNavigation'
import AddNodeDefPanel from './components/addNodeDefPanel'
import NodeDefSwitch from './nodeDefs/nodeDefSwitch'

import * as SurveyFormState from './surveyFormState'

import { setFormNodeDefAddChildTo, resetForm } from './actions'

const SurveyFormView = props => {
  const {
    surveyInfo,
    surveyCycleKey,
    nodeDef,
    edit,
    entry,
    preview,
    hasNodeDefAddChildTo,
    showPageNavigation,
    canEditDef,
    canEditRecord,
    recordUuid,
    parentNode,
    isSideBarOpened,
    history,
    setFormNodeDefAddChildTo,
    resetForm,
  } = props

  const editAllowed = edit && canEditDef

  let className = editAllowed ? ' edit' : ''
  className += hasNodeDefAddChildTo ? '' : ' form-actions-off'
  className += showPageNavigation ? '' : ' page-navigation-off'

  // If showPageNavigation, addNodeDefAddChildTo or sideBar change, trigger window resize to re-render react-grid-layout form
  useOnUpdate(() => {
    const reactGridLayoutElems = document.querySelectorAll('.react-grid-layout')
    for (const el of reactGridLayoutElems) {
      el.classList.remove('mounted')
    }

    dispatchWindowResize()
    setTimeout(() => {
      for (const el of reactGridLayoutElems) {
        el.classList.add('mounted')
      }
    }, 100)
  }, [showPageNavigation, hasNodeDefAddChildTo, isSideBarOpened])

  // On cycle update, reset form
  useOnUpdate(() => {
    resetForm()
  }, [surveyCycleKey])

  useEffect(() => {
    // OnUnmount if it's in editAllowed mode, set nodeDefAddChildTo to null
    return () => {
      if (editAllowed) {
        setFormNodeDefAddChildTo(null)
      }
    }
  }, [])

  return nodeDef ? (
    <div>
      {editAllowed && <NodeDefEdit />}

      <FormHeader
        surveyCycleKey={surveyCycleKey}
        edit={edit}
        entry={entry && canEditRecord}
        preview={preview}
        history={history}
        canEditDef={canEditDef}
      />

      <div className={`survey-form${className}`}>
        {showPageNavigation && (
          <FormPageNavigation
            surveyInfo={surveyInfo}
            surveyCycleKey={surveyCycleKey}
            edit={edit}
            entry={entry}
            canEditDef={canEditDef}
            level={0}
          />
        )}

        <NodeDefSwitch
          surveyInfo={surveyInfo}
          surveyCycleKey={surveyCycleKey}
          nodeDef={nodeDef}
          edit={edit}
          entry={entry}
          preview={preview}
          recordUuid={recordUuid}
          parentNode={parentNode}
          canEditDef={canEditDef}
          canEditRecord={canEditRecord}
        />

        {editAllowed && hasNodeDefAddChildTo && <AddNodeDefPanel />}
      </div>
    </div>
  ) : null
}

SurveyFormView.defaultProps = {
  surveyInfo: null,
  // Current nodeDef page
  nodeDef: null,
  // Form in edit mode
  edit: false,
  // Form in data entry mode
  entry: false,
  // Form in preview mode
  preview: false,
  // Can edit the form definition
  canEditDef: false,
  // Uuid of current record
  recordUuid: null,
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const nodeDef = SurveyFormState.getFormActivePageNodeDef(state)
  const hasNodeDefAddChildTo = Boolean(SurveyFormState.getNodeDefAddChildTo(state))
  const record = RecordState.getRecord(state)
  const showPageNavigation = SurveyFormState.showPageNavigation(state)
  const isSideBarOpened = SideBarState.isOpened(state)

  const mapEntryProps = () => ({
    parentNode: nodeDef ? SurveyFormState.getFormPageParentNode(nodeDef)(state) : null,
    recordUuid: Record.getUuid(record),
  })

  return {
    surveyInfo,
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
    nodeDef,
    hasNodeDefAddChildTo,
    showPageNavigation,
    isSideBarOpened,
    ...(props.entry ? mapEntryProps() : {}),
  }
}

const enhance = compose(withRouter, connect(mapStateToProps, { setFormNodeDefAddChildTo, resetForm }))
export default enhance(SurveyFormView)
