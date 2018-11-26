import './style/surveyForm.scss'
import './style/react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'

import FormNavigation from './navigation/formNavigation'
import FormActions from './components/formActions'
import NodeDefEdit from './nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from './nodeDefs/nodeDefSwitch'

import { getStateSurveyInfo, getSurvey } from '../../survey/surveyState'

import { getFormActivePageNodeDef, getFormPageParentNode, getSurveyForm } from './surveyFormState'

import { getRecord } from './record/recordState'

const SurveyFormView = (props) => {

  const {
    surveyInfo,
    nodeDef,
    edit,
    entry,
    canEdit,

    recordLoaded,
    recordId,
    parentNode
  } = props

  const editAllowed = edit && canEdit

  return nodeDef
    ? (
      <div className={`survey-form form-designer${editAllowed ? ' edit' : ''}`}>

        {
          editAllowed &&
          <NodeDefEdit/>
        }

        <FormNavigation edit={edit} entry={entry}/>

        {
          nodeDef && (edit || (entry && recordLoaded))
            ? <NodeDefSwitch surveyInfo={surveyInfo}
                             nodeDef={nodeDef}
                             edit={edit}
                             entry={entry}
                             recordId={recordId}
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
  // can edit the form definition
  canEdit: false,
  // if record to edit has been loaded
  recordLoaded: null,
  // recordId of current record
  recordId: null,
}

const mapStateToProps = (state, props) => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)
  const nodeDef = getFormActivePageNodeDef(survey)(surveyForm)
  const record = getRecord(surveyForm)

  const mapEntryProps = () => ({
    recordLoaded: !!record,
    parentNode: nodeDef ? getFormPageParentNode(survey, nodeDef)(surveyForm) : null,
    recordId: record ? record.id : null,
  })

  return {
    surveyInfo: getStateSurveyInfo(state),
    nodeDef,
    ...props.entry
      ? mapEntryProps()
      : {},
  }

}

export default connect(mapStateToProps)(SurveyFormView)