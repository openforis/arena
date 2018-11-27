import React from 'react'
import { connect } from 'react-redux'

import CommonProps from './commonProps'
import TabBar from '../../../commonComponents/tabBar'
import CodeListsView from '../components/codeListsView'
import TaxonomiesView from '../components/taxonomiesView'

import NodeDef from '../../../../common/survey/nodeDef'

import { getSurvey } from '../../../survey/surveyState'
import { closeFormNodeDefEdit } from '../actions'
import { putNodeDefProp } from './../../../survey/nodeDefs/actions'
import { getFormNodeDefEdit, getSurveyForm } from '../surveyFormState'
import DefaultValues from './defaultValues'

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
      putNodeDefProp,
      canUpdateCodeList
    } = this.props

    const {
      editingCodeList,
      editingTaxonomy,
    } = this.state

    return nodeDef
      ? (
        <div className="survey-form__node-def-edit">
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
                <div>
                  <TabBar
                    tabs={[
                      {
                        label: 'Basic',
                        component: (
                          <div className="form">
                            <CommonProps nodeDef={nodeDef}
                                         putNodeDefProp={putNodeDefProp}
                                         toggleCodeListEdit={(editing) => this.setState({editingCodeList: editing})}
                                         toggleTaxonomyEdit={(editing) => this.setState({editingTaxonomy: editing})}/>
                          </div>
                        ),
                      },
                      {
                        label: 'Advanced',
                        component: (
                          <DefaultValues nodeDef={nodeDef}
                                         putNodeDefProp={putNodeDefProp}/>
                        )
                      }
                    ]}/>
                  <div className="flex-center">
                    <button className="btn btn-of-light"
                            onClick={() => this.close()}>Done
                    </button>
                  </div>
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

  return {
    nodeDef
  }
}

export default connect(
  mapStateToProps,
  {putNodeDefProp, closeFormNodeDefEdit}
)(NodeDefEdit)