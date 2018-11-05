import React from 'react'
import { connect } from 'react-redux'

import CommonProps from './commonProps'
import CodeListsView from '../components/codeListsView'
import TaxonomiesView from '../components/taxonomiesView'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'

import { putNodeDefProp } from '../../../survey/nodeDefs/actions'
import { createCodeList } from '../codeListEdit/actions'
import { createTaxonomy } from '../taxonomyEdit/actions'

import { getSurvey } from '../../../survey/surveyState'
import { closeFormNodeDefEdit } from '../actions'
import { getFormNodeDefEdit, getSurveyForm } from '../surveyFormState'

class NodeDefEdit extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      editingCodeList: false,
      editingTaxonomy: false,
    }
  }

  close () {
    const {closeFormNodeDefEdit} = this.props
    closeFormNodeDefEdit()
  }

  render () {
    const {nodeDef, putNodeDefProp, survey} = this.props
    const {editingCodeList, editingTaxonomy} = this.state

    return nodeDef
      ? (
        <div className="survey-form__node-def-edit">
          {
            editingCodeList
              ?
              <CodeListsView onClose={() => this.setState({editingCodeList: false})}
                             canSelect={Survey.canUpdateCodeList(nodeDef)(survey)}
                             onSelect={codeList => putNodeDefProp(nodeDef, 'codeListUUID', codeList.uuid)}
                             selectedCodeListUUID={NodeDef.getNodeDefCodeListUUID(nodeDef)}/>

              : editingTaxonomy
              ?
              <TaxonomiesView onClose={() => this.setState({editingTaxonomy: false})}
                              canSelect={true}
                              onSelect={taxonomy => putNodeDefProp(nodeDef, 'taxonomyUUID', taxonomy.uuid)}
                              selectedTaxonomyUUID={NodeDef.getNodeDefTaxonomyUUID(nodeDef)}/>
              :
              <div className="form">
                <CommonProps {...this.props}
                             toggleCodeListEdit={(editing) => this.setState({editingCodeList: editing})}
                             toggleTaxonomyEdit={(editing) => this.setState({editingTaxonomy: editing})}/>

                <div style={{justifySelf: 'center'}}>
                  <button className="btn btn-of-light"
                          onClick={() => this.close()}>Done
                  </button>
                </div>
              </div>
          }
        </div>
      )
      : null

  }
}

NodeDefEdit.defaultProps = {
  nodeDef: null,
}
const mapStateToProps = state => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)

  return {
    survey,
    nodeDef: getFormNodeDefEdit(survey)(surveyForm),
  }
}

export default connect(
  mapStateToProps,
  {closeFormNodeDefEdit, putNodeDefProp, createCodeList, createTaxonomy}
)(NodeDefEdit)