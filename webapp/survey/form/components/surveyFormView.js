import './surveyForm.scss'

import React from 'react'
import { connect } from 'react-redux'

import FormNavigation from './formNavigation'
import FormActions from './formActions'
import NodeDefEdit from './nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from '../../nodeDefs/components/nodeDefSwitch'

import { getSurveyInfo } from '../../../../common/survey/survey'
import { getSurvey } from '../../surveyState'

import { getFormActivePageNodeDef, getFormPageParentNode } from '../surveyFormState'

import { getRecord } from '../../record/recordState'

const SurveyFormView = (props) => {

  const {
    surveyInfo,
    nodeDef,
    edit,
    entry,
    draft,

    recordLoaded,
    record,
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
                               draft={draft}
                               record={record}
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
  // load draft props
  draft: false,
  // if record to edit had been loaded
  recordLoaded: null,
}

const mapStateToProps = (state, props) => {
  const survey = getSurvey(state)
  const nodeDef = getFormActivePageNodeDef(survey)

  const mapEntryProps = () => ({
    // rootNode: getRootNode(getRecord(survey)),
    recordLoaded: !!getRecord(survey),
    parentNode: nodeDef ? getFormPageParentNode(nodeDef)(survey) : null,
  })

  return {
    surveyInfo: getSurveyInfo(survey),
    record: getRecord(survey),
    nodeDef,
    ...props.entry
      ? mapEntryProps()
      : {},
  }

}

export default connect(mapStateToProps)(SurveyFormView)