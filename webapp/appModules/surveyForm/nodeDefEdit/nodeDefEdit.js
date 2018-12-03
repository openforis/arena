import './nodeDefEdit.scss'

import React from 'react'
import { connect } from 'react-redux'

import TabBar from '../../../commonComponents/tabBar'
import BasicProps from './basic/basicProps'
import AdvancedProps from './advanced/advancedProps'
import CategoriesView from '../components/categoriesView'
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
      editingCategory: false,
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
      canUpdateCategory
    } = this.props

    const {
      editingCategory,
      editingTaxonomy,
    } = this.state

    return nodeDef
      ? (
        <div className="node-def-edit">
          {
            editingCategory
              ? <CategoriesView canSelect={canUpdateCategory}
                                onSelect={category => putNodeDefProp(nodeDef, 'categoryUuid', category.uuid)}
                                selectedItemUUID={NodeDef.getNodeDefCategoryUuid(nodeDef)}
                                onClose={() => this.setState({editingCategory: false})}/>
              : editingTaxonomy
              ? <TaxonomiesView canSelect={true}
                                onSelect={taxonomy => putNodeDefProp(nodeDef, 'taxonomyUuid', taxonomy.uuid)}
                                selectedItemUUID={NodeDef.getNodeDefTaxonomyUuid(nodeDef)}
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
                                      toggleCategoryEdit={(editing) => this.setState({editingCategory: editing})}
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