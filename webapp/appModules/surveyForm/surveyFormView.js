import './style/surveyForm.scss'
import './style/react-grid-layout.scss'

import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import FormNavigation from './navigation/formNavigation'
import FormActions from './components/formActions'
import NodeDefEdit from './nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from './nodeDefs/nodeDefSwitch'

import Survey from '../../../common/survey/survey'
import * as SurveyState from '../../survey/surveyState'
import * as SurveyFormState from './surveyFormState'
import * as RecordState from './record/recordState'

const SurveyFormView = (props) => {

  const {
    surveyInfo,
    nodeDef,
    edit,
    entry,
    preview,
    canEdit,

    recordLoaded,
    recordUuid,
    parentNode,

    history,
  } = props

  const editAllowed = edit && canEdit && !preview

  const className = editAllowed
    ? ' form-designer edit'
    : edit && !preview
      ? ' form-designer'
      : ''

  return nodeDef
    ? (
      <div className={`survey-form${className}`}>

        {
          editAllowed &&
          <NodeDefEdit/>
        }

        <FormNavigation edit={edit} entry={entry} preview={preview} history={history}/>

        {
          nodeDef && (edit || (entry && recordLoaded))
            ? <NodeDefSwitch surveyInfo={surveyInfo}
                             nodeDef={nodeDef}
                             edit={edit}
                             entry={entry}
                             recordUuid={recordUuid}
                             parentNode={parentNode}
                             canEditDef={canEdit}/>
            : <div/>
        }

        {
          editAllowed
            ? <FormActions/>
            : null
        }

      </div>
    )
    : null

}

SurveyFormView.defaultProps = {
  // current nodeDef page
  nodeDef: null,
  // form in edit mode
  edit: false,
  // form in data entry mode
  entry: false,
  // form in preview mode
  preview: false,
  // can edit the form definition
  canEdit: false,
  // if record to edit has been loaded
  recordLoaded: null,
  // uuid of current record
  recordUuid: null,
}

const mapStateToProps = (state, props) => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const nodeDef = SurveyFormState.getFormActivePageNodeDef(survey)(surveyForm)
  const record = RecordState.getRecord(surveyForm)

  const mapEntryProps = () => ({
    recordLoaded: !!record,
    parentNode: nodeDef ? SurveyFormState.getFormPageParentNode(survey, nodeDef)(surveyForm) : null,
    recordUuid: record ? record.uuid : null,
  })

  return {
    surveyInfo,
    nodeDef,
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