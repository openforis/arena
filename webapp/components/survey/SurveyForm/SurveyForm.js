import './SurveyForm.scss'
import './react-grid-layout.scss'

import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect, useDispatch } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { matchPath } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

import { dispatchWindowResize } from '@webapp/utils/domUtils'

import { useIsSidebarOpened } from '@webapp/service/storage/sidebar'
import { SurveyFormActions, SurveyFormState } from '@webapp/store/ui/surveyForm'
import { RecordState } from '@webapp/store/ui/record'
import { SurveyState } from '@webapp/store/survey'
import { appModuleUri, dataModules, designerModules } from '@webapp/app/appModules'
import { useHistoryListen, useOnUpdate } from '@webapp/components/hooks'

import FormHeader from './FormHeader'
import FormPageNavigation from './FormPageNavigation'
import AddNodeDefPanel from './components/addNodeDefPanel'
import NodeDefSwitch from './nodeDefs/nodeDefSwitch'

const SurveyForm = (props) => {
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
  } = props

  const dispatch = useDispatch()
  const isSideBarOpened = useIsSidebarOpened()
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
    dispatch(SurveyFormActions.resetForm())
  }, [surveyCycleKey])

  useEffect(() => {
    // OnUnmount if it's in editAllowed mode, set nodeDefAddChildTo to null
    return () => {
      if (editAllowed) {
        dispatch(SurveyFormActions.setFormNodeDefAddChildTo(null))
      }
    }
  }, [])

  useEffect(() => {
    // OnUnmount Record resetForm
    return () => {
      if (
        !matchPath(window.location.pathname, {
          path: appModuleUri(designerModules.formDesigner),
        })
      ) {
        dispatch(SurveyFormActions.resetForm())
      }
    }
  }, [])

  useHistoryListen((location) => {
    // user enters in records the form is reset
    if (
      matchPath(location.pathname, {
        path: appModuleUri(canEditDef ? dataModules.records : designerModules.formDesigner),
      })
    ) {
      dispatch(SurveyFormActions.resetForm())
    }
  }, [])

  return nodeDef ? (
    <div>
      <FormHeader edit={edit} entry={entry && canEditRecord} preview={preview} canEditDef={canEditDef} />

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

SurveyForm.defaultProps = {
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
    ...(props.entry ? mapEntryProps() : {}),
  }
}

const enhance = compose(withRouter, connect(mapStateToProps))
export default enhance(SurveyForm)
