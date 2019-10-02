import './surveyForm.scss'
import './react-grid-layout.scss'

import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import Survey from '../../../../common/survey/survey'
import Record from '../../../../common/record/record'

import FormHeader from './components/formHeader'
import FormPageNavigation from './components/formPageNavigation'
import AddNodeDefPanel from './components/addNodeDefPanel'
import NodeDefEdit from '../nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from './nodeDefs/nodeDefSwitch'
import { useOnUpdate } from '../../../commonComponents/hooks'

import * as AppState from '../../../app/appState'
import * as SurveyState from '../../../survey/surveyState'
import * as SurveyFormState from './surveyFormState'
import * as RecordState from '../record/recordState'

import { setFormNodeDefAddChildTo, resetForm } from './actions'

import { dispatchWindowResize } from '../../../utils/domUtils'

const SurveyFormView = (props) => {

  const {
    surveyInfo, surveyCycleKey, nodeDef,
    edit, entry, preview,
    hasNodeDefAddChildTo, showPageNavigation,
    canEditDef, canEditRecord,
    recordUuid, parentNode,
    isSideBarOpened,
    history,
    setFormNodeDefAddChildTo, resetForm,
  } = props

  const editAllowed = edit && canEditDef

  let className = editAllowed ? ' edit' : ''
  className += hasNodeDefAddChildTo ? '' : ' form-actions-off'
  className += showPageNavigation ? '' : ' page-navigation-off'

  //if showPageNavigation, addNodeDefAddChildTo or sideBar change, trigger window resize to re-render react-grid-layout form
  useOnUpdate(() => {
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
    },
    [showPageNavigation, hasNodeDefAddChildTo, isSideBarOpened]
  )

  // on cycle update, reset form
  useOnUpdate(() => {
    resetForm()
  }, [surveyCycleKey])

  useEffect(() => {
    // onUnmount if it's in editAllowed mode, set nodeDefAddChildTo to null
    return () => {
      if (editAllowed) {
        setFormNodeDefAddChildTo(null)
      }
    }
  }, [])

  return nodeDef
    ? (
      <div>

        {
          editAllowed &&
          <NodeDefEdit/>
        }

        <FormHeader
          edit={edit}
          entry={entry && canEditRecord}
          preview={preview}
          history={history}
          canEditDef={canEditDef}
        />

        <div className={`survey-form${className}`}>

          {
            <FormPageNavigation
              surveyInfo={surveyInfo}
              surveyCycleKey={surveyCycleKey}
              edit={edit}
              entry={entry}
              canEditDef={canEditDef}
              level={0}
              showPageNavigation={showPageNavigation}
            />
          }

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
            canEditRecord={canEditRecord}/>

          {
            editAllowed && hasNodeDefAddChildTo &&
            <AddNodeDefPanel/>
          }

        </div>

      </div>
    )
    : null

}

SurveyFormView.defaultProps = {
  surveyInfo: null,
  // current nodeDef page
  nodeDef: null,
  // form in edit mode
  edit: false,
  // form in data entry mode
  entry: false,
  // form in preview mode
  preview: false,
  // can edit the form definition
  canEditDef: false,
  // uuid of current record
  recordUuid: null,
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const nodeDef = SurveyFormState.getFormActivePageNodeDef(state)
  const hasNodeDefAddChildTo = !!SurveyFormState.getNodeDefAddChildTo(state)
  const record = RecordState.getRecord(state)
  const showPageNavigation = SurveyFormState.showPageNavigation(state)
  const isSideBarOpened = AppState.isSideBarOpened(state)

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
    ...props.entry
      ? mapEntryProps()
      : {},
  }

}

const enhance = compose(
  withRouter,
  connect(mapStateToProps, { setFormNodeDefAddChildTo, resetForm })
)
export default enhance(SurveyFormView)