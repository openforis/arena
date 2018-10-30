import './surveyForm.scss'

import React from 'react'
import { connect } from 'react-redux'

import FormNavigation from './formNavigation'
import FormActions from './formActions'
import NodeDefEdit from './nodeDefEdit/nodeDefEdit'
import NodeDefSwitch from '../../nodeDefs/components/nodeDefSwitch'

import { getSurvey } from '../../surveyState'

import { getFormActivePageNodeDef, getFormPageParentNode } from '../surveyFormState'

import { fetchNodeDefs } from '../../nodeDefs/actions'
import { fetchCodeLists } from '../../codeLists/actions'
import { fetchTaxonomies } from '../../taxonomies/actions'
import { resetForm, setFormActivePage, setFormNodeDefUnlocked, setFormPageNode } from '../actions'

import { getRecord } from '../../record/recordState'

class SurveyFormView extends React.Component {

  componentDidMount () {
    const {edit, resetForm, fetchNodeDefs, fetchCodeLists, fetchTaxonomies} = this.props

    resetForm()
    fetchNodeDefs(edit)
    fetchCodeLists(edit)
    fetchTaxonomies(edit)
  }

  render () {
    const {
      nodeDef,
      edit,
      entry,
      recordLoaded,
    } = this.props

    return (
      nodeDef ?
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
  // current nodeDef page
  nodeDef: null,
  // can edit form
  edit: false,
  // can entry data
  entry: false,
  // load draft props
  draft: false,
  // record being edited
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
    survey,
    record: getRecord(survey),
    nodeDef,
    ...props.entry
      ? mapEntryProps()
      : {},
  }

}

export default connect(
  mapStateToProps,
  {
    fetchNodeDefs, fetchCodeLists, fetchTaxonomies,
    resetForm, setFormActivePage, setFormPageNode, setFormNodeDefUnlocked,
  }
)(SurveyFormView)