import React from 'react'
import * as R from 'ramda'

import { FormItem } from '../../../commonComponents/form/input'
import Dropdown from '../../../commonComponents/form/dropdown'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import CodeList from '../../../../common/survey/codeList'
import Validator from '../../../../common/validation/validator'

import {
  isRenderCheckbox,
  isRenderDropdown,
  nodeDefLayoutProps,
  nodeDefRenderType
} from '../../../../common/survey/nodeDefLayout'

const CodeListProps = (props) => {
  const {
    survey,
    nodeDef,
    putNodeDefProp,

    createCodeList,
    toggleCodeListEdit,
  } = props

  const validation = Validator.getValidation(nodeDef)
  const selectedCodeList = Survey.getCodeListByUUID(NodeDef.getNodeDefCodeListUUID(nodeDef))(survey)
  const candidateParentCodeNodeDefs = Survey.getNodeDefCodeCandidateParents(nodeDef)(survey)
  const parentCodeDef = Survey.getNodeDefParentCode(nodeDef)(survey)
  const parentCodeDefLabelFunction = def => (
    NodeDef.getNodeDefName(def)
    + ' ('
    + CodeList.getCodeListLevelName(
      CodeList.getCodeListLevelByIndex(
        Survey.getNodeDefCodeListLevelIndex(def)
        (survey)
      )(selectedCodeList)
    )
    + ')'
  )
  const disabled = !Survey.canUpdateCodeList(nodeDef)(survey)

  return (
    <React.Fragment>

      <FormItem label={'Code List'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(2, 100px)',
        }}>
          <Dropdown disabled={disabled}
                    items={Survey.getCodeListsArray(survey)}
                    itemKeyProp={'uuid'}
                    itemLabelFunction={codeList => CodeList.getCodeListName(codeList)}
                    validation={Validator.getFieldValidation('codeListUUID')(validation)}
                    selection={selectedCodeList}
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
                    itemLabelFunction={parentCodeDefLabelFunction}
                    onChange={def => putNodeDefProp(nodeDef, 'parentCodeUUID', def ? def.uuid : null)}/>
        </div>
      </FormItem>
    </React.Fragment>
  )
}

export default CodeListProps