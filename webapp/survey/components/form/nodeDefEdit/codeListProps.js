import React from 'react'
import * as R from 'ramda'

import { FormItem } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'

import {
  getSurveyCodeListByUUID,
  getSurveyCodeListsArray,
  getNodeDefCodeParent,
  getNodeDefCodeCandidateParents,
  getNodeDefCodeListLevelIndex,
  canUpdateCodeList,
} from '../../../../../common/survey/survey'

import {
  getNodeDefName,
  getCodeListUUID,
} from '../../../../../common/survey/nodeDef'

import {
  isRenderCheckbox,
  isRenderDropdown,
  nodeDefLayoutProps,
  nodeDefRenderType
} from '../../../../../common/survey/nodeDefLayout'

import {
  getValidation,
} from '../../../../../common/validation/validator'

import {
  getCodeListName,
  getCodeListLevelByIndex,
  getCodeListLevelName,
} from '../../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../../common/validation/validator'

const CodeListProps = (props) => {
  const {
    survey,
    nodeDef,
    putNodeDefProp,

    createCodeList,
    toggleCodeListEdit,
  } = props

  const validation = getValidation(nodeDef)
  const selectedCodeList = getSurveyCodeListByUUID(getCodeListUUID(nodeDef))(survey)
  const candidateParentCodeNodeDefs = getNodeDefCodeCandidateParents(nodeDef)(survey)
  const parentCodeDef = getNodeDefCodeParent(nodeDef)(survey)
  const parentCodeDefLabelFunction = def => (
    getNodeDefName(def)
    + ' ('
    + getCodeListLevelName(
      getCodeListLevelByIndex(
        getNodeDefCodeListLevelIndex(def)
        (survey)
      )(selectedCodeList)
    )
    + ')'
  )
  const disabled = !canUpdateCodeList(nodeDef)(survey)

  return (
    <React.Fragment>

      <FormItem label={'Code List'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(2, 100px)',
        }}>
          <Dropdown disabled={disabled}
                    items={getSurveyCodeListsArray(survey)}
                    itemKeyProp={'uuid'}
                    itemLabelFunction={codeList => getCodeListName(codeList)}
                    validation={getFieldValidation('codeListUUID')(validation)}
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