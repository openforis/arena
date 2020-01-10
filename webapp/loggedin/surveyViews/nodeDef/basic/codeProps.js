import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { Link, useHistory } from 'react-router-dom'

import { FormItem } from '@webapp/commonComponents/form/input'
import Dropdown from '@webapp/commonComponents/form/dropdown'
import ButtonGroup from '@webapp/commonComponents/form/buttonGroup'
import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Validation from '@core/validation/validation'

import * as SurveyState from '@webapp/survey/surveyState'
import { setNodeDefProp, setNodeDefLayoutProp } from '@webapp/survey/nodeDefs/actions'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import * as NodeDefState from '../nodeDefState'

import { createCategory, deleteCategory } from '../../category/actions'

const CodeProps = props => {
  const {
    surveyCycleKey,
    nodeDef,
    validation,
    setNodeDefProp,
    setNodeDefLayoutProp,
    categories,
    canUpdateCategory,
    category,
    candidateParentCodeNodeDefs,
    parentCodeDef,
    createCategory,
  } = props

  const i18n = useI18n()
  const history = useHistory()

  const displayAsItems = [
    {
      key: NodeDefLayout.renderType.checkbox,
      label: i18n.t('nodeDefEdit.codeProps.displayAsTypes.checkbox'),
    },
    {
      key: NodeDefLayout.renderType.dropdown,
      label: i18n.t('nodeDefEdit.codeProps.displayAsTypes.dropdown'),
    },
  ]

  const disabled = !canUpdateCategory

  const putCategoryProp = category => {
    setNodeDefProp(NodeDef.propKeys.parentCodeDefUuid, null) // Reset parent code
    setNodeDefProp(NodeDef.propKeys.categoryUuid, Category.getUuid(category))
  }

  return (
    <>
      <FormItem label={i18n.t('nodeDefEdit.codeProps.category')}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr repeat(2, 100px)',
          }}
        >
          <Dropdown
            disabled={disabled}
            items={categories}
            itemKeyProp={'uuid'}
            itemLabelFunction={Category.getName}
            validation={Validation.getFieldValidation(NodeDef.propKeys.categoryUuid)(validation)}
            selection={category}
            onChange={putCategoryProp}
          />
          <button
            className="btn btn-s"
            style={{ justifySelf: 'center' }}
            onClick={async () => {
              putCategoryProp(await createCategory(history))
            }}
          >
            <span className="icon icon-plus icon-12px icon-left" />
            {i18n.t('common.add')}
          </button>
          <Link className="btn btn-s" style={{ justifySelf: 'center' }} to={appModuleUri(designerModules.categories)}>
            <span className="icon icon-list icon-12px icon-left" />
            {i18n.t('common.manage')}
          </Link>
        </div>
      </FormItem>

      {!NodeDef.isAnalysis(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.codeProps.parentCode')}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 200px',
              }}
            >
              <Dropdown
                disabled={disabled || R.isEmpty(candidateParentCodeNodeDefs)}
                items={candidateParentCodeNodeDefs}
                selection={parentCodeDef}
                itemKeyProp={'uuid'}
                itemLabelFunction={NodeDef.getName}
                onChange={def => setNodeDefProp(NodeDef.propKeys.parentCodeDefUuid, NodeDef.getUuid(def))}
              />
            </div>
          </FormItem>

          <FormItem label={i18n.t('nodeDefEdit.codeProps.displayAs')}>
            <ButtonGroup
              selectedItemKey={NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)}
              onChange={render => setNodeDefLayoutProp(NodeDefLayout.keys.renderType, render)}
              items={displayAsItems}
            />
          </FormItem>
        </>
      )}
    </>
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDef = NodeDefState.getNodeDef(state)

  return {
    categories: Survey.getCategoriesArray(survey),
    canUpdateCategory: Survey.canUpdateCategory(nodeDef)(survey),
    category: Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey),
    candidateParentCodeNodeDefs: Survey.getNodeDefCodeCandidateParents(nodeDef)(survey),
    parentCodeDef: Survey.getNodeDefParentCode(nodeDef)(survey),
  }
}

export default connect(mapStateToProps, {
  setNodeDefProp,
  setNodeDefLayoutProp,
  createCategory,
  deleteCategory,
})(CodeProps)
