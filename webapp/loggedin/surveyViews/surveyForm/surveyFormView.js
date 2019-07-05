import './surveyForm.scss'
import './react-grid-layout.scss'

import React from 'react'
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

const SurveyFormView = (props) => {

  const {
    surveyInfo, nodeDef,
    edit, entry, preview,
    hasNodeDefAddChildTo, showPageNavigation,
    canEditDef, canEditRecord,

    recordUuid, parentNode,

    history,
  } = props

  const editAllowed = edit && canEditDef

  let className = editAllowed && hasNodeDefAddChildTo
    ? ' form-designer edit'
    : editAllowed
      ? ' form-designer edit form-actions-off'
      : edit
        ? ' form-designer'
        : ''
  className += showPageNavigation ? '' : ' page-navigation-off'

  return nodeDef
    ? (
      <div className={`survey-form${className}`}>

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

        <div className="survey-form-container">

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


          {
            nodeDef &&
            <NodeDefSwitch
              surveyInfo={surveyInfo}
              nodeDef={nodeDef}
              edit={edit}
              entry={entry}
              recordUuid={recordUuid}
              parentNode={parentNode}
              canEditDef={canEditDef}
              canEditRecord={canEditRecord}/>
          }

          {
            editAllowed &&
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
  connect(mapStateToProps)
)
export default enhance(SurveyFormView)