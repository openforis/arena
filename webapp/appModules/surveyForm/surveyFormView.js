import './style/surveyForm.scss'

import React from 'react'
import { connect } from 'react-redux'

import FormNavigation from './components/formNavigation'
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

    recordLoaded,
    recordId,
    parentNode
  } = props

  return nodeDef
    ? (
      <React.Fragment>

        {
          edit
            ? <NodeDefEdit/>
            : null
        }

        <div className={`survey-form${edit ? ' edit' : ''}`}>

          <FormNavigation edit={edit}/>

          {
            nodeDef && (edit || (entry && recordLoaded))
              ? <NodeDefSwitch surveyInfo={surveyInfo}
                               nodeDef={nodeDef}
                               edit={edit}
                               entry={entry}
                               recordId={recordId}
                               parentNode={parentNode}/>
              : <div/>
          }

          {
            edit
              ? <FormActions/>
              : null
          }

        </div>
      </React.Fragment>
    )
    : null

}

SurveyFormView.defaultProps = {
  // current nodeDef page
  nodeDef: null,
  // can edit form
  edit: false,
  // can entry data
  entry: false,
  // if record to edit had been loaded
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
    // rootNode: getRootNode(getRecord(survey)),
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