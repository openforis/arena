import './nodeDefEdit.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import useI18n from '../../../commonComponents/useI18n'

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
import * as NodeDefEditState from './nodeDefEditState'

import { putNodeDefProp } from './../../../survey/nodeDefs/actions'
import { closeNodeDefEdit } from './actions'

const NodeDefEdit = props => {
  const {
    nodeDef, nodeDefParent,
    nodeDefKeyEditDisabled, nodeDefMultipleEditDisabled,
    displayAsEnabled, displayInEnabled,
    putNodeDefProp,
    canUpdateCategory,
    closeNodeDefEdit,
  } = props

  const i18n = useI18n()

  const [ editingCategory, setEditingCategory ] = useState(false)
  const [ editingTaxonomy, setEditingTaxonomy ] = useState(false)

  const close = () => closeNodeDefEdit()

  return nodeDef
    ? (
      <div className="node-def-edit">
        {
          editingCategory
            ? (
              <CategoriesView
                canSelect={canUpdateCategory}
                onSelect={category => putNodeDefProp(nodeDef, NodeDef.propKeys.categoryUuid, Category.getUuid(category))}
                selectedItemUuid={NodeDef.getCategoryUuid(nodeDef)}
                onClose={() => setEditingCategory(false)}/>
            )
            : editingTaxonomy
              ? (
                <TaxonomiesView
                  canSelect={true}
                  onSelect={taxonomy => putNodeDefProp(nodeDef, NodeDef.propKeys.taxonomyUuid, Taxonomy.getUuid(taxonomy))}
                  selectedItemUuid={NodeDef.getTaxonomyUuid(nodeDef)}
                  onClose={() => setEditingTaxonomy(false)}/>
              )
              : (
                <div className="node-def-edit__container">
                  <TabBar tabs={[
                    {
                      label: i18n.t('nodeDefEdit.basic'),
                      component: BasicProps,
                      props: {
                        nodeDef,
                        nodeDefKeyEditDisabled,
                        nodeDefMultipleEditDisabled,
                        displayAsEnabled,
                        displayInEnabled,
                        putNodeDefProp,
                        toggleCategoryEdit: editing => setEditingCategory(editing),
                        toggleTaxonomyEdit: editing => setEditingTaxonomy(editing),
                      },
                    },
                    ...NodeDef.isRoot(nodeDef)
                      ? []
                      : [
                        {
                          label: i18n.t('nodeDefEdit.advanced'),
                          component: AdvancedProps,
                          props: { nodeDef, nodeDefParent, putNodeDefProp },
                        },
                        {
                          label: i18n.t('nodeDefEdit.validations'),
                          component: ValidationsProps,
                          props: { nodeDef, nodeDefParent, putNodeDefProp },
                        },
                      ],
                  ]}
                  />

                  <button className="btn btn-close"
                          onClick={() => close()}>{i18n.t('common.done')}
                  </button>

                </div>
              )
        }
      </div>
    )
    : null

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
  const nodeDef = NodeDefEditState.getNodeDef(state)
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
  { putNodeDefProp, closeNodeDefEdit }
)(NodeDefEdit)