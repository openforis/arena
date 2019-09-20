import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { FormItem } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'
import ButtonGroup from '../../../../commonComponents/form/buttonGroup'
import useI18n from '../../../../commonComponents/useI18n'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import Category from '../../../../../common/survey/category'
import NodeDefLayout from '../../../../../common/survey/nodeDefLayout'
import Validation from '../../../../../common/validation/validation'

import * as SurveyState from '../../../../survey/surveyState'
import * as NodeDefEditState from '../nodeDefEditState'

import { putNodeDefProp } from '../../../../survey/nodeDefs/actions'
import { createCategory, deleteCategory } from '../../categoryEdit/actions'

const { propKeys } = NodeDef

const displayAsItems = [
  {
    key: NodeDefLayout.nodeDefRenderType.checkbox,
    label: 'Checkbox'
  },
  {
    key: NodeDefLayout.nodeDefRenderType.dropdown,
    label: 'Dropdown'
  }
]

const CodeProps = (props) => {
  const {
    nodeDef, validation,
    putNodeDefProp,
    categories,
    canUpdateCategory,
    category,
    candidateParentCodeNodeDefs,
    parentCodeDef,
    createCategory,
    toggleCategoryEdit,
  } = props

  const disabled = !canUpdateCategory

  const putCategoryProp = category => {
    putNodeDefProp(nodeDef, propKeys.parentCodeDefUuid, null) //reset parent code
    putNodeDefProp(nodeDef, propKeys.categoryUuid, Category.getUuid(category))
  }

  const i18n = useI18n()

  return (
    <React.Fragment>

      <FormItem label={'Category'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(2, 100px)',
        }}>
          <Dropdown disabled={disabled}
                    items={categories}
                    itemKeyProp={'uuid'}
                    itemLabelFunction={Category.getName}
                    validation={Validation.getFieldValidation(propKeys.categoryUuid)(validation)}
                    selection={category}
                    onChange={putCategoryProp}/>
          <button className="btn btn-s"
                  style={{ justifySelf: 'center' }}
                  onClick={async () => {
                    putCategoryProp(await createCategory())
                    toggleCategoryEdit(true)
                  }}>

            <span className="icon icon-plus icon-12px icon-left"/>
            {i18n.t('common.add')}
          </button>
          <button className="btn btn-s"
                  style={{ justifySelf: 'center' }}
                  onClick={() => toggleCategoryEdit(true)}>
            <span className="icon icon-list icon-12px icon-left"/>
            {i18n.t('common.manage')}
          </button>
        </div>
      </FormItem>

      <FormItem label={'Parent Code'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 200px',
        }}>
          <Dropdown disabled={disabled || R.isEmpty(candidateParentCodeNodeDefs)}
                    items={candidateParentCodeNodeDefs}
                    selection={parentCodeDef}
                    itemKeyProp={'uuid'}
                    itemLabelFunction={NodeDef.getName}
                    onChange={def => putNodeDefProp(nodeDef, propKeys.parentCodeDefUuid, NodeDef.getUuid(def))}/>
        </div>
      </FormItem>

      <FormItem label={'Display As'}>
        <ButtonGroup selectedItemKey={NodeDefLayout.getRenderType(nodeDef)}
                     onChange={render => putNodeDefProp(nodeDef, NodeDefLayout.nodeDefLayoutProps.render, render)}
                     items={displayAsItems}
        />
      </FormItem>

    </React.Fragment>
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDef = NodeDefEditState.getNodeDef(state)

  return {
    categories: Survey.getCategoriesArray(survey),
    canUpdateCategory: Survey.canUpdateCategory(nodeDef)(survey),
    category: Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey),
    candidateParentCodeNodeDefs: Survey.getNodeDefCodeCandidateParents(nodeDef)(survey),
    parentCodeDef: Survey.getNodeDefParentCode(nodeDef)(survey),
  }
}

export default connect(
  mapStateToProps,
  {
    putNodeDefProp,
    createCategory,
    deleteCategory,
  }
)(CodeProps)

