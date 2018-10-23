import './form/surveyForm.scss'

import React from 'react'
import { connect } from 'react-redux'

import FormNavigation from './form/formNavigation'
import FormActions from './form/formActions'
import NodeDefEdit from './form/nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from '../nodeDef/components/nodeDefSwitch'

import { getRootNodeDef } from '../../../common/survey/survey'
import { getSurvey, getFormActivePageNodeDef, getFormPageParentNode } from '../surveyState'
import { getRecord } from '../record/recordState'

import { fetchRootNodeDef } from '../actions'
import { resetForm, setFormActivePage, setFormNodeDefUnlocked, setFormPageNode } from '../nodeDef/actions'

class SurveyFormView extends React.Component {

  componentDidMount () {
    const {resetForm, fetchRootNodeDef, edit} = this.props

    resetForm()
    fetchRootNodeDef(edit)
  }

  componentDidUpdate () {
    const {rootNodeDef, nodeDef, recordLoaded, setFormActivePage, edit, entry} = this.props

    if (edit && rootNodeDef && !nodeDef) {
      setFormActivePage(rootNodeDef)
    }

    if (entry && rootNodeDef && recordLoaded && !nodeDef) {
      setFormActivePage(rootNodeDef)
    }
  }

  render () {
    const {
      rootNodeDef,
      nodeDef,

      edit,
      entry,

      recordLoaded,
    } = this.props

    return (
      rootNodeDef ?
        <React.Fragment>

          {
            edit
              ? <NodeDefEdit/>
              : null
          }

          <div className={`survey-form${edit ? ' edit' : ''}`}>

            <FormNavigation {...this.props}/>

            {
              nodeDef && (edit || (entry && recordLoaded))
                ? <NodeDefSwitch {...this.props} />
                : <div/>
            }

            {
              edit
                ? <FormActions/>
                : null
            }

          </div>
        </React.Fragment>
        : null
    )
  }

}

SurveyFormView.defaultProps = {
  //root entity
  rootNodeDef: null,
  // current nodeDef page
  nodeDef: null,
  // can edit form
  edit: false,
  // load draft props
  draft: false,
  // can entry data
  entry: false,
  // record being edited
  recordLoaded: null,
}

const mapStateToProps = (state, props) => {
  const survey = getSurvey(state)

  const rootNodeDef = getRootNodeDef(survey)
  const nodeDef = getFormActivePageNodeDef(state)

  const mapEntryProps = () => ({
    // rootNode: getRootNode(getRecord(survey)),
    recordLoaded: !!getRecord(survey),
    parentNode: nodeDef ? getFormPageParentNode(nodeDef)(state) : null,
  })

  return {
    survey,
    record: getRecord(survey),
    rootNodeDef,
    nodeDef,
    ...props.entry
      ? mapEntryProps()
      : {},
  }

}

export default connect(
  mapStateToProps,
  {resetForm, fetchRootNodeDef, setFormActivePage, setFormPageNode, setFormNodeDefUnlocked}
)(SurveyFormView)