import './surveyForm.scss'
import './react-grid-layout.scss'

import React, { useEffect } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import Survey from '../../../../common/survey/survey'
import Record from '../../../../common/record/record'

import FormHeader from './components/formHeader'
import FormActions from './components/formActions'
import FormPageNavigation from './components/formPageNavigation'
import NodeDefEdit from '../nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from './nodeDefs/nodeDefSwitch'

import * as SurveyState from '../../../survey/surveyState'
import * as SurveyFormState from './surveyFormState'
import * as RecordState from '../record/recordState'

import { setFormNodeDefAddChildTo } from './actions'

const SurveyFormView = (props) => {

  const {
    surveyInfo, nodeDef,
    edit, entry, preview,
    hasNodeDefAddChildTo, showPageNavigation,
    canEditDef, canEditRecord,

    recordUuid, parentNode,

    history,
    setFormNodeDefAddChildTo,
  } = props

  const editAllowed = edit && canEditDef

  let className = editAllowed ? ' edit' : ''
  className += hasNodeDefAddChildTo ? '' : ' form-actions-off'
  className += showPageNavigation ? '' : ' page-navigation-off'

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
            showPageNavigation &&
            <FormPageNavigation
              surveyInfo={surveyInfo}
              edit={edit}
              entry={entry}
              canEditDef={canEditDef}
              level={0}
            />
          }

          <NodeDefSwitch
            surveyInfo={surveyInfo}
            nodeDef={nodeDef}
            edit={edit}
            entry={entry}
            recordUuid={recordUuid}
            parentNode={parentNode}
            canEditDef={canEditDef}
            canEditRecord={canEditRecord}/>

          {
            editAllowed && hasNodeDefAddChildTo &&
            <FormActions/>
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

  const mapEntryProps = () => ({
    parentNode: nodeDef ? SurveyFormState.getFormPageParentNode(nodeDef)(state) : null,
    recordUuid: Record.getUuid(record),
  })

  return {
    surveyInfo,
    nodeDef,
    hasNodeDefAddChildTo,
    showPageNavigation,
    ...props.entry
      ? mapEntryProps()
      : {},
  }

}

const enhance = compose(
  withRouter,
  connect(mapStateToProps, { setFormNodeDefAddChildTo })
)
export default enhance(SurveyFormView)