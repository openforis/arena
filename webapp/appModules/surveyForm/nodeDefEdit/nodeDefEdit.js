import './nodeDefEdit.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import TabBar from '../../../commonComponents/tabBar'
import BasicProps from './basic/basicProps'
import AdvancedProps from './advanced/advancedProps'
import ValidationsProps from './advanced/validationsProps'
import CategoriesView from '../components/categoriesView'
import TaxonomiesView from '../components/taxonomiesView'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'

import { getSurvey } from '../../../survey/surveyState'
import { closeFormNodeDefEdit } from '../actions'
import { putNodeDefProp } from './../../../survey/nodeDefs/actions'
import { getFormNodeDefEdit, getSurveyForm } from '../surveyFormState'
import { isRenderTable } from '../../../../common/survey/nodeDefLayout'

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
      nodeDef, nodeDefParent,
      nodeDefKeyEditDisabled, nodeDefMultipleEditDisabled,
      displayAsEnabled, displayInEnabled,
      putNodeDefProp,
      canUpdateCategory
    } = this.props

    const {
      editingCategory,
      editingTaxonomy,
    } = this.state

    const tabs = [
      {
        label: 'Basic',
        component: (
          <BasicProps
            nodeDef={nodeDef}
            nodeDefKeyEditDisabled={nodeDefKeyEditDisabled}
            nodeDefMultipleEditDisabled={nodeDefMultipleEditDisabled}
            displayAsEnabled={displayAsEnabled}
            displayInEnabled={displayInEnabled}
            putNodeDefProp={putNodeDefProp}
            toggleCategoryEdit={(editing) => this.setState({ editingCategory: editing })}
            toggleTaxonomyEdit={(editing) => this.setState({ editingTaxonomy: editing })}
          />
        )
        ,
      },
      ...NodeDef.isNodeDefRoot(nodeDef)
        ? []
        : [
          {
            label: 'Advanced',
            component: (
              <AdvancedProps
                nodeDef={nodeDef}
                nodeDefParent={nodeDefParent}
                putNodeDefProp={putNodeDefProp}/>
            )
          },
          {
            label: 'Validations',
            component: (
              <ValidationsProps
                nodeDef={nodeDef}
                nodeDefParent={nodeDefParent}
                putNodeDefProp={putNodeDefProp}/>
            )

          }
        ]
    ]

    return nodeDef
      ? (
        <div className="node-def-edit">
          {
            editingCategory ?
              (
                <CategoriesView
                  canSelect={canUpdateCategory}
                  onSelect={category => putNodeDefProp(nodeDef, 'categoryUuid', category.uuid)}
                  selectedItemUuid={NodeDef.getNodeDefCategoryUuid(nodeDef)}
                  onClose={() => this.setState({ editingCategory: false })}/>
              )
              : editingTaxonomy ?
              (
                <TaxonomiesView
                  canSelect={true}
                  onSelect={taxonomy => putNodeDefProp(nodeDef, 'taxonomyUuid', taxonomy.uuid)}
                  selectedItemUuid={NodeDef.getNodeDefTaxonomyUuid(nodeDef)}
                  onClose={() => this.setState({ editingTaxonomy: false })}/>
              )
              : (
                <div className="node-def-edit__container">
                  <TabBar tabs={tabs}/>

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
  nodeDefParent: null,
}

const isNodeDefKeyEditDisabled = (survey, nodeDef) =>
  !nodeDef ||
  NodeDef.isNodeDefRoot(nodeDef) ||
  NodeDef.isNodeDefMultiple(nodeDef) ||
  (
    !NodeDef.isNodeDefKey(nodeDef) &&
    Survey.getNodeDefKeys(Survey.getNodeDefParent(nodeDef)(survey))(survey).length >= NodeDef.maxKeyAttributes
  ) ||
  NodeDef.isNodeDefReadOnly(nodeDef)

const isNodeDefMultipleEditDisabled = (survey, nodeDef) =>
  !nodeDef ||
  NodeDef.isNodeDefPublished(nodeDef) ||
  NodeDef.isNodeDefKey(nodeDef) ||
  isRenderTable(nodeDef) ||
  Survey.isNodeDefParentCode(nodeDef)(survey) ||
  NodeDef.isNodeDefReadOnly(nodeDef)

const isDisplayAsEnabled = (survey, nodeDef) => {
  const children = Survey.getNodeDefChildren(nodeDef)(survey)

  return !NodeDef.isNodeDefRoot(nodeDef) &&
    NodeDef.isNodeDefMultipleEntity(nodeDef) &&
    R.none(NodeDef.isNodeDefEntity, children)
}

const isDisplayInEnabled = (nodeDef) =>
  !NodeDef.isNodeDefRoot(nodeDef) && NodeDef.isNodeDefEntity(nodeDef)

const mapStateToProps = state => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)
  const nodeDef = getFormNodeDefEdit(survey)(surveyForm)
  const nodeDefParent = Survey.getNodeDefByUuid(
    NodeDef.getNodeDefParentUuid(nodeDef)
  )(survey)

  const nodeDefKeyEditDisabled = isNodeDefKeyEditDisabled(survey, nodeDef)
  const nodeDefMultipleEditDisabled = isNodeDefMultipleEditDisabled(survey, nodeDef)
  const displayAsEnabled = nodeDef && isDisplayAsEnabled(survey, nodeDef)
  const displayInEnabled = nodeDef && isDisplayInEnabled(nodeDef)

  return {
    nodeDef,
    nodeDefParent,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
    displayAsEnabled,
    displayInEnabled,
    canUpdateCategory: NodeDef.isNodeDefCode(nodeDef) && Survey.canUpdateCategory(nodeDef)(survey)
  }
}

export default connect(
  mapStateToProps,
  { putNodeDefProp, closeFormNodeDefEdit }
)(NodeDefEdit)