import React from 'react'
import { connect } from 'react-redux'

import CommonProps from './commonProps'
import CodeListsView from '../components/codeListsView'
import TaxonomiesView from '../components/taxonomiesView'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'

import { putNodeDefProp } from '../../../survey/nodeDefs/actions'
import { createCodeList, deleteCodeList } from '../codeListEdit/actions'
import { createTaxonomy, deleteTaxonomy } from '../taxonomyEdit/actions'

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
    const {
      nodeDef, putNodeDefProp,
      //code list
      codeLists, codeList, candidateParentCodeNodeDefs, parentCodeDef,
      canUpdateCodeList, createCodeList, deleteCodeList,
      //taxonomy
      taxonomies, taxonomy, createTaxonomy, deleteTaxonomy
    } = this.props
    const {editingCodeList, editingTaxonomy} = this.state

    return nodeDef
      ? (
        <div className="survey-form__node-def-edit">
          {
            editingCodeList
              ?
              <CodeListsView onClose={() => this.setState({editingCodeList: false})}
                             canSelect={canUpdateCodeList}
                             onSelect={codeList => putNodeDefProp(nodeDef, 'codeListUUID', codeList.uuid)}
                             selectedItemUUID={NodeDef.getNodeDefCodeListUUID(nodeDef)}
                             onDelete={deleteCodeList}/>

              : editingTaxonomy
              ?
              <TaxonomiesView canSelect={true}
                              onSelect={taxonomy => putNodeDefProp(nodeDef, 'taxonomyUUID', taxonomy.uuid)}
                              selectedItemUUID={NodeDef.getNodeDefTaxonomyUUID(nodeDef)}
                              onDelete={deleteTaxonomy}
                              onClose={() => this.setState({editingTaxonomy: false})}/>
              :
              <div className="form">
                <CommonProps nodeDef={nodeDef}
                             putNodeDefProp={putNodeDefProp}
                             codeLists={codeLists}
                             codeList={codeList}
                             canUpdateCodeList={canUpdateCodeList}
                             candidateParentCodeNodeDefs={candidateParentCodeNodeDefs}
                             parentCodeDef={parentCodeDef}
                             createCodeList={createCodeList}
                             taxonomies={taxonomies}
                             taxonomy={taxonomy}
                             createTaxonomy={createTaxonomy}
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
  const nodeDef = getFormNodeDefEdit(survey)(surveyForm)

  const isCodeList = NodeDef.isNodeDefCodeList(nodeDef)
  const isTaxon = NodeDef.isNodeDefTaxon(nodeDef)

  return {
    nodeDef,
    //code list
    codeLists: isCodeList ? Survey.getCodeListsArray(survey) : null,
    canUpdateCodeList: isCodeList ? Survey.canUpdateCodeList(nodeDef)(survey) : false,
    codeList: isCodeList ? Survey.getCodeListByUUID(NodeDef.getNodeDefCodeListUUID(nodeDef))(survey) : null,
    candidateParentCodeNodeDefs: isCodeList ? Survey.getNodeDefCodeCandidateParents(nodeDef)(survey) : null,
    parentCodeDef: isCodeList ? Survey.getNodeDefParentCode(nodeDef)(survey) : null,
    //taxonomy
    taxonomy: isTaxon ? Survey.getTaxonomyByUUID(NodeDef.getNodeDefTaxonomyUUID(nodeDef))(survey) : null,
    taxonomies: isTaxon ? Survey.getTaxonomiesArray(survey) : null,
  }
}

export default connect(
  mapStateToProps,
  {
    closeFormNodeDefEdit,
    putNodeDefProp,
    createCodeList,
    deleteCodeList,
    createTaxonomy,
    deleteTaxonomy,
  }
)(NodeDefEdit)