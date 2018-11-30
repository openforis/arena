import './nodeDefEdit.scss'

import React from 'react'
import { connect } from 'react-redux'

import TabBar from '../../../commonComponents/tabBar'
import BasicProps from './basic/basicProps'
import AdvancedProps from './advanced/advancedProps'
import CodeListsView from '../components/codeListsView'
import TaxonomiesView from '../components/taxonomiesView'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'

import { getSurvey } from '../../../survey/surveyState'
import { closeFormNodeDefEdit } from '../actions'
import { putNodeDefProp } from './../../../survey/nodeDefs/actions'
import { getFormNodeDefEdit, getSurveyForm } from '../surveyFormState'

class NodeDefEdit extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      editingCodeList: false,
      editingTaxonomy: false
    }
  }

  close () {
    this.props.closeFormNodeDefEdit()
  }

  render () {
    const {
      nodeDef,
      nodeDefKeyEditDisabled,
      putNodeDefProp,
      canUpdateCodeList
    } = this.props

    const {
      editingCodeList,
      editingTaxonomy,
    } = this.state

    return nodeDef
      ? (
        <div className="node-def-edit">
          {
            editingCodeList
              ? <CodeListsView canSelect={canUpdateCodeList}
                               onSelect={codeList => putNodeDefProp(nodeDef, 'codeListUUID', codeList.uuid)}
                               selectedItemUUID={NodeDef.getNodeDefCodeListUUID(nodeDef)}
                               onClose={() => this.setState({editingCodeList: false})}/>
              : editingTaxonomy
              ? <TaxonomiesView canSelect={true}
                                onSelect={taxonomy => putNodeDefProp(nodeDef, 'taxonomyUUID', taxonomy.uuid)}
                                selectedItemUUID={NodeDef.getNodeDefTaxonomyUUID(nodeDef)}
                                onClose={() => this.setState({editingTaxonomy: false})}/>
              : (
                <div className="node-def-edit__container">
                  <TabBar
                    tabs={[
                      {
                        label: 'Basic',
                        component: (
                          <BasicProps nodeDef={nodeDef}
                                      nodeDefKeyEditDisabled={nodeDefKeyEditDisabled}
                                      putNodeDefProp={putNodeDefProp}
                                      toggleCodeListEdit={(editing) => this.setState({editingCodeList: editing})}
                                      toggleTaxonomyEdit={(editing) => this.setState({editingTaxonomy: editing})}/>
                        ),
                      },
                      {
                        label: 'Advanced',
                        component: (
                          <AdvancedProps nodeDef={nodeDef}
                                         putNodeDefProp={putNodeDefProp}/>
                        )
                      }
                    ]}/>

                  <button className="btn btn-of-light btn-close"
                          onClick={() => this.close()}>Done
                  </button>

                </div>
              )
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

  let nodeDefKeyEditDisabled = false
  if (nodeDef) {
    const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
    const keyDefs = parentDef ? Survey.getNodeDefKeys(parentDef)(survey) : []

    nodeDefKeyEditDisabled = !NodeDef.isNodeDefKey(nodeDef) && keyDefs.length >= NodeDef.maxKeyAttributes
  }

  return {
    nodeDef,
    nodeDefKeyEditDisabled
  }
}

export default connect(
  mapStateToProps,
  {putNodeDefProp, closeFormNodeDefEdit}
)(NodeDefEdit)