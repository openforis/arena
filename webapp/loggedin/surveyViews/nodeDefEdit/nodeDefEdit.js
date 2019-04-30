import './nodeDefEdit.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import TabBar from '../../../commonComponents/tabBar'
import BasicProps from './basic/basicProps'
import AdvancedProps from './advanced/advancedProps'
import ValidationsProps from './advanced/validationsProps'
import CategoriesView from '../categories/categoriesView'
import TaxonomiesView from '../taxonomies/taxonomiesView'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import Category from '../../../../common/survey/category'
import Taxonomy from '../../../../common/survey/taxonomy'
import { isRenderTable } from '../../../../common/survey/nodeDefLayout'

import * as SurveyState from '../../../survey/surveyState'
import { getFormNodeDefEdit, getSurveyForm } from '../surveyForm/surveyFormState'

import { closeFormNodeDefEdit } from '../surveyForm/actions'
import { putNodeDefProp } from './../../../survey/nodeDefs/actions'

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

    return nodeDef
      ? (
        <div className="node-def-edit">
          {
            editingCategory ?
              (
                <CategoriesView
                  canSelect={canUpdateCategory}
                  onSelect={category => putNodeDefProp(nodeDef, NodeDef.propKeys.categoryUuid, Category.getUuid(category))}
                  selectedItemUuid={NodeDef.getCategoryUuid(nodeDef)}
                  onClose={() => this.setState({ editingCategory: false })}/>
              )
              : editingTaxonomy ?
              (
                <TaxonomiesView
                  canSelect={true}
                  onSelect={taxonomy => putNodeDefProp(nodeDef, NodeDef.propKeys.taxonomyUuid, Taxonomy.getUuid(taxonomy))}
                  selectedItemUuid={NodeDef.getTaxonomyUuid(nodeDef)}
                  onClose={() => this.setState({ editingTaxonomy: false })}/>
              )
              : (
                <div className="node-def-edit__container">
                  <TabBar tabs={[
                    {
                      label: 'Basic',
                      component: BasicProps,
                      props: {
                        nodeDef,
                        nodeDefKeyEditDisabled,
                        nodeDefMultipleEditDisabled,
                        displayAsEnabled,
                        displayInEnabled,
                        putNodeDefProp,
                        toggleCategoryEdit: (editing) => this.setState({ editingCategory: editing }),
                        toggleTaxonomyEdit: (editing) => this.setState({ editingTaxonomy: editing })
                      },
                    },
                    ...NodeDef.isRoot(nodeDef)
                      ? []
                      : [
                        {
                          label: 'Advanced',
                          component: AdvancedProps,
                          props: { nodeDef, nodeDefParent, putNodeDefProp },
                        },
                        {
                          label: 'Validations',
                          component: ValidationsProps,
                          props: { nodeDef, nodeDefParent, putNodeDefProp },
                        }
                      ]
                  ]}
                  />

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
  NodeDef.isRoot(nodeDef) ||
  NodeDef.isMultiple(nodeDef) ||
  (
    !NodeDef.isKey(nodeDef) &&
    Survey.getNodeDefKeys(Survey.getNodeDefParent(nodeDef)(survey))(survey).length >= NodeDef.maxKeyAttributes
  ) ||
  NodeDef.isReadOnly(nodeDef)

const isNodeDefMultipleEditDisabled = (survey, nodeDef) =>
  !nodeDef ||
  NodeDef.isPublished(nodeDef) ||
  NodeDef.isKey(nodeDef) ||
  isRenderTable(nodeDef) ||
  Survey.isNodeDefParentCode(nodeDef)(survey) ||
  NodeDef.isReadOnly(nodeDef)

const isDisplayAsEnabled = (survey, nodeDef) => {
  const children = Survey.getNodeDefChildren(nodeDef)(survey)

  return !NodeDef.isRoot(nodeDef) &&
    NodeDef.isMultipleEntity(nodeDef) &&
    R.none(NodeDef.isEntity, children)
}

const isDisplayInEnabled = (nodeDef) =>
  !NodeDef.isRoot(nodeDef) && NodeDef.isEntity(nodeDef)

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const surveyForm = getSurveyForm(state)
  const nodeDef = getFormNodeDefEdit(survey)(surveyForm)
  const nodeDefParent = Survey.getNodeDefByUuid(
    NodeDef.getParentUuid(nodeDef)
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
    canUpdateCategory: NodeDef.isCode(nodeDef) && Survey.canUpdateCategory(nodeDef)(survey)
  }
}

export default connect(
  mapStateToProps,
  { putNodeDefProp, closeFormNodeDefEdit }
)(NodeDefEdit)