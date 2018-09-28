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
  getCodeListName,
  getCodeListLevelByIndex,
  getCodeListLevelName,
} from '../../../../../common/survey/codeList'

const getCodeListItem = (codeList) => ({key: codeList.uuid, value: getCodeListName(codeList)})
const getCodeListItems = R.pipe(getSurveyCodeListsArray, R.map(getCodeListItem))

const CodeListProps = (props) => {

  const {
    survey,
    nodeDef,
    putNodeDefProp,

    createCodeList,
    toggleCodeListEdit,
  } = props

  const selectedCodeList = getSurveyCodeListByUUID(getCodeListUUID(nodeDef))(survey)
  const codeListLevelName = getCodeListLevelName(
    getCodeListLevelByIndex(getNodeDefCodeListLevelIndex(nodeDef)(survey))(selectedCodeList)
  )
  const possibleParentCodeNodeDefs = getNodeDefCodeCandidateParents(nodeDef)(survey)
  const possibleParentCodeItems = possibleParentCodeNodeDefs.map(nodeDef => ({
    key: nodeDef.uuid,
    value: getNodeDefName(nodeDef)
  }))

  const parentCodeDef = getNodeDefCodeParent(nodeDef)(survey)

  const disabled = !canUpdateCodeList(nodeDef)(survey)

  return (
    <React.Fragment>

      <FormItem label={'Code List'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(2, 100px)',
        }}>
          <Dropdown disabled={disabled}
                    items={getCodeListItems(survey)}
                    selection={selectedCodeList ? getCodeListItem(selectedCodeList) : null}
                    onChange={item => {
                      putNodeDefProp(nodeDef, 'parentCodeUUID', null) //reset parent code
                      putNodeDefProp(nodeDef, 'codeListUUID', item ? item.key : null)
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
          <Dropdown disabled={disabled}
                    items={possibleParentCodeItems}
                    selection={parentCodeDef ? {key: parentCodeDef.uuid, value: getNodeDefName(parentCodeDef)} : null}
                    onChange={item => putNodeDefProp(nodeDef, 'parentCodeUUID', item ? item.key : null)}/>
          <FormItem label="Level">
            <label>{codeListLevelName}</label>
          </FormItem>
        </div>
      </FormItem>
    </React.Fragment>
  )
}

export default CodeListProps