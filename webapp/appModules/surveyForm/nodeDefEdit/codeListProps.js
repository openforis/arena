import React from 'react'
import * as R from 'ramda'

import Dropdown from '../../../commonComponents/form/dropdown'

import NodeDef from '../../../../common/survey/nodeDef'
import CodeList from '../../../../common/survey/codeList'
import Validator from '../../../../common/validation/validator'

import {
  isRenderCheckbox,
  isRenderDropdown,
  nodeDefLayoutProps,
  nodeDefRenderType
} from '../../../../common/survey/nodeDefLayout'
import { getSurvey } from '../../../survey/surveyState'
import { getFormNodeDefEdit, getSurveyForm } from '../surveyFormState'
import Survey from '../../../../common/survey/survey'
import connect from 'react-redux/es/connect/connect'
import { putNodeDefProp } from '../../../survey/nodeDefs/actions'
import { createCodeList, deleteCodeList } from '../codeListEdit/actions'

const CodeListProps = (props) => {
  const {
    nodeDef,
    putNodeDefProp,
    codeLists,
    canUpdateCodeList,
    codeList,
    candidateParentCodeNodeDefs,
    parentCodeDef,
    createCodeList,
    toggleCodeListEdit,
  } = props

  const validation = Validator.getValidation(nodeDef)

  const disabled = !canUpdateCodeList

  return (
    <React.Fragment>

      <FormItem label={'Code List'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(2, 100px)',
        }}>
          <Dropdown disabled={disabled}
                    items={codeLists}
                    itemKeyProp={'uuid'}
                    itemLabelFunction={CodeList.getCodeListName}
                    validation={Validator.getFieldValidation('codeListUUID')(validation)}
                    selection={codeList}
                    onChange={codeList => {
                      putNodeDefProp(nodeDef, 'parentCodeUUID', null) //reset parent code
                      putNodeDefProp(nodeDef, 'codeListUUID', codeList ? codeList.uuid : null)
                    }}/>
          <button className="btn btn-s btn-of-light-xs"
                  style={{justifySelf: 'center'}}
                  onClick={() => {
                    createCodeList()
                    toggleCodeListEdit(true)
                  }}>

            <span className="icon icon-plus icon-16px icon-left"/>
            ADD
          </button>
          <button className="btn btn-s btn-of-light-xs"
                  style={{justifySelf: 'center'}}
                  onClick={() => toggleCodeListEdit(true)}>
            <span className="icon icon-list icon-16px icon-left"/>
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

  const isCodeList = NodeDef.isNodeDefCodeList(nodeDef)

  return {
    codeLists: isCodeList ? Survey.getCodeListsArray(survey) : null,
    canUpdateCodeList: isCodeList ? Survey.canUpdateCodeList(nodeDef)(survey) : false,
    codeList: isCodeList ? Survey.getCodeListByUUID(NodeDef.getNodeDefCodeListUUID(nodeDef))(survey) : null,
    candidateParentCodeNodeDefs: isCodeList ? Survey.getNodeDefCodeCandidateParents(nodeDef)(survey) : null,
    parentCodeDef: isCodeList ? Survey.getNodeDefParentCode(nodeDef)(survey) : null,
  }
}

export default connect(
  mapStateToProps,
  {
    putNodeDefProp,
    createCodeList,
    deleteCodeList,
  }
)(CodeListProps)

