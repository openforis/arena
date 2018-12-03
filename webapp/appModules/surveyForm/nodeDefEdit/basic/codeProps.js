import React from 'react'
import * as R from 'ramda'

import { FormItem } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'

import NodeDef from '../../../../../common/survey/nodeDef'
import CodeList from '../../../../../common/survey/category'
import Validator from '../../../../../common/validation/validator'

import {
  isRenderCheckbox,
  isRenderDropdown,
  nodeDefLayoutProps,
  nodeDefRenderType
} from '../../../../../common/survey/nodeDefLayout'
import { getSurvey } from '../../../../survey/surveyState'
import { getFormNodeDefEdit, getSurveyForm } from '../../surveyFormState'
import Survey from '../../../../../common/survey/survey'
import connect from 'react-redux/es/connect/connect'
import { putNodeDefProp } from '../../../../survey/nodeDefs/actions'
import { createCategory, deleteCategory } from '../../categoryEdit/actions'

const CodeProps = (props) => {
  const {
    nodeDef,
    putNodeDefProp,
    categories,
    canUpdateCategory,
    category,
    candidateParentCodeNodeDefs,
    parentCodeDef,
    createCategory,
    toggleCategoryEdit,
  } = props

  const validation = Validator.getValidation(nodeDef)

  const disabled = !canUpdateCategory

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
                    itemLabelFunction={CodeList.getName}
                    validation={Validator.getFieldValidation('categoryUuid')(validation)}
                    selection={category}
                    onChange={category => {
                      putNodeDefProp(nodeDef, 'parentCodeUuid', null) //reset parent code
                      putNodeDefProp(nodeDef, 'categoryUuid', category ? category.uuid : null)
                    }}/>
          <button className="btn btn-s btn-of-light-xs"
                  style={{justifySelf: 'center'}}
                  onClick={() => {
                    createCategory()
                    toggleCategoryEdit(true)
                  }}>

            <span className="icon icon-plus icon-12px icon-left"/>
            ADD
          </button>
          <button className="btn btn-s btn-of-light-xs"
                  style={{justifySelf: 'center'}}
                  onClick={() => toggleCategoryEdit(true)}>
            <span className="icon icon-list icon-12px icon-left"/>
            MANAGE
          </button>
        </div>
      </FormItem>

      <FormItem label={'Display As'}>
        <div>
          <button className={`btn btn-of-light ${isRenderDropdown(nodeDef) ? 'active' : ''}`}
                  onClick={() => putNodeDefProp(nodeDef, nodeDefLayoutProps.render, nodeDefRenderType.dropdown)}>
            Dropdown
          </button>
          <button className={`btn btn-of-light ${isRenderCheckbox(nodeDef) ? 'active' : ''}`}
                  onClick={() => putNodeDefProp(nodeDef, nodeDefLayoutProps.render, nodeDefRenderType.checkbox)}>
            Checkbox
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
                    itemLabelFunction={NodeDef.getNodeDefName}
                    onChange={def => putNodeDefProp(nodeDef, 'parentCodeUUID', def ? def.uuid : null)}/>
        </div>
      </FormItem>
    </React.Fragment>
  )
}

const mapStateToProps = state => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)
  const nodeDef = getFormNodeDefEdit(survey)(surveyForm)

  const isCode = NodeDef.isNodeDefCode(nodeDef)

  return {
    categories: isCode ? Survey.getCategoriesArray(survey) : null,
    canUpdateCategory: isCode ? Survey.canUpdateCategory(nodeDef)(survey) : false,
    category: isCode ? Survey.getCategoryByUuid(NodeDef.getNodeDefCategoryUuid(nodeDef))(survey) : null,
    candidateParentCodeNodeDefs: isCode ? Survey.getNodeDefCodeCandidateParents(nodeDef)(survey) : null,
    parentCodeDef: isCode ? Survey.getNodeDefParentCode(nodeDef)(survey) : null,
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

