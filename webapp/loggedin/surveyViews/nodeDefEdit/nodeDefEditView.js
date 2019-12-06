import './nodeDefEditView.scss'

import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'

import * as StringUtils from '@core/stringUtils'

import { useI18n } from '@webapp/commonComponents/hooks'
import TabBar from '@webapp/commonComponents/tabBar'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as SurveyState from '@webapp/survey/surveyState'
import { putNodeDefProp, putNodeDefLayoutProp } from '@webapp/survey/nodeDefs/actions'
import { useParams } from 'react-router'
import TaxonomiesView from '../taxonomies/taxonomiesView'
import CategoriesView from '../categories/categoriesView'

import * as NodeDefEditState from './nodeDefEditState'
import ValidationsProps from './advanced/validationsProps'
import AdvancedProps from './advanced/advancedProps'
import BasicProps from './basic/basicProps'
import { closeNodeDefEdit, setNodeDefForEdit } from './actions'

const NodeDefEditView = props => {
  const {
    nodeDef,
    nodeDefParent,
    validation,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
    putNodeDefProp,
    putNodeDefLayoutProp,
    canUpdateCategory,
    setNodeDefForEdit,
    closeNodeDefEdit,
  } = props

  const i18n = useI18n()
  const { nodeDefUuid } = useParams()

  const [editingCategory, setEditingCategory] = useState(false)
  const [editingTaxonomy, setEditingTaxonomy] = useState(false)

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) setNodeDefForEdit(nodeDefUuid)
  }, [])

  return nodeDef ? (
    <div className="node-def-edit">
      {editingCategory ? (
        <CategoriesView
          canSelect={canUpdateCategory}
          onSelect={category => putNodeDefProp(nodeDef, NodeDef.propKeys.categoryUuid, Category.getUuid(category))}
          selectedItemUuid={NodeDef.getCategoryUuid(nodeDef)}
          onClose={() => setEditingCategory(false)}
        />
      ) : editingTaxonomy ? (
        <TaxonomiesView
          canSelect={true}
          onSelect={taxonomy => putNodeDefProp(nodeDef, NodeDef.propKeys.taxonomyUuid, Taxonomy.getUuid(taxonomy))}
          selectedItemUuid={NodeDef.getTaxonomyUuid(nodeDef)}
          onClose={() => setEditingTaxonomy(false)}
        />
      ) : (
        <div className="node-def-edit__container">
          <TabBar
            tabs={[
              {
                label: i18n.t('nodeDefEdit.basic'),
                component: BasicProps,
                props: {
                  nodeDef,
                  validation,
                  nodeDefKeyEditDisabled,
                  nodeDefMultipleEditDisabled,
                  putNodeDefProp,
                  putNodeDefLayoutProp,
                  toggleCategoryEdit: editing => setEditingCategory(editing),
                  toggleTaxonomyEdit: editing => setEditingTaxonomy(editing),
                },
              },
              ...(NodeDef.isRoot(nodeDef)
                ? []
                : [
                    {
                      label: i18n.t('nodeDefEdit.advanced'),
                      component: AdvancedProps,
                      props: {
                        nodeDef,
                        validation,
                        nodeDefParent,
                        putNodeDefProp,
                      },
                    },
                    {
                      label: i18n.t('nodeDefEdit.validations'),
                      component: ValidationsProps,
                      props: {
                        nodeDef,
                        validation,
                        nodeDefParent,
                        putNodeDefProp,
                      },
                    },
                  ]),
            ]}
          />

          <button
            className="btn btn-close"
            onClick={() => closeNodeDefEdit()}
            aria-disabled={StringUtils.isBlank(NodeDef.getName(nodeDef))}
          >
            {i18n.t('common.done')}
          </button>
        </div>
      )}
    </div>
  ) : null
}

NodeDefEditView.defaultProps = {
  nodeDef: null,
  nodeDefParent: null,
}

const isNodeDefKeyEditDisabled = (survey, nodeDef) =>
  !nodeDef ||
  NodeDef.isRoot(nodeDef) ||
  NodeDef.isMultiple(nodeDef) ||
  (!NodeDef.isKey(nodeDef) &&
    Survey.getNodeDefKeys(Survey.getNodeDefParent(nodeDef)(survey))(survey).length >= NodeDef.maxKeyAttributes) ||
  NodeDef.isReadOnly(nodeDef)

const isNodeDefMultipleEditDisabled = (survey, nodeDef) =>
  !nodeDef ||
  NodeDef.isPublished(nodeDef) ||
  NodeDef.isKey(nodeDef) ||
  NodeDefLayout.isRenderTable(nodeDef) ||
  Survey.isNodeDefParentCode(nodeDef)(survey) ||
  NodeDef.isReadOnly(nodeDef)

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDef = NodeDefEditState.getNodeDef(state)
  const nodeDefParent = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nodeDef))(survey)
  const validation = Survey.getNodeDefValidation(nodeDef)(survey)

  const nodeDefKeyEditDisabled = isNodeDefKeyEditDisabled(survey, nodeDef)
  const nodeDefMultipleEditDisabled = isNodeDefMultipleEditDisabled(survey, nodeDef)

  return {
    nodeDef,
    nodeDefParent,
    validation,
    nodeDefKeyEditDisabled,
    nodeDefMultipleEditDisabled,
    canUpdateCategory: NodeDef.isCode(nodeDef) && Survey.canUpdateCategory(nodeDef)(survey),
  }
}

export default connect(mapStateToProps, {
  putNodeDefProp,
  putNodeDefLayoutProp,
  setNodeDefForEdit,
  closeNodeDefEdit,
})(NodeDefEditView)
