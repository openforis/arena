import React from 'react'
import * as R from 'ramda'

import { FormItem } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'

import {
  getSurveyCodeListByUUID,
  getSurveyCodeListsArray,
} from '../../../../../common/survey/survey'

import {
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
} from '../../../../../common/survey/codeList'

const getCodeListItem = (codeList) => ({key: codeList.uuid, value: getCodeListName(codeList)})
const getCodeListItems = R.pipe(getSurveyCodeListsArray, R.map(getCodeListItem))

const CodeListProps = (props) => {

  const {
    survey,
    nodeDef,
    putNodeDefProp,

    createCodeList,
    onCodeListEdit,
  } = props

  const selectedCodeList = getSurveyCodeListByUUID(getCodeListUUID(nodeDef))(survey)

  const parentCodeAvailable = false //R.path(['levels', 'length'], selectedCodeList) > 0 //hierarchical TODO
  const possibleParentCodeItems = [] //isCodeList ? [] : [] //TODO
  const selectedParentCode = null //R.find(item => item.key === getNodeDefProp('parentCodeId')(nodeDef))(possibleParentCodeItems)

  return (
    <React.Fragment>

      <FormItem label={'Code List'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(2, 100px)',
        }}>
          <Dropdown items={getCodeListItems(survey)}
                    selection={selectedCodeList ? getCodeListItem(selectedCodeList) : null}
                    onChange={item => putNodeDefProp(nodeDef, 'codeListUUID', item.key)}/>
          <button className="btn btn-s btn-of-light-xs"
                  style={{justifySelf:'center'}}
                  onClick={() => {
                    createCodeList()
                    onCodeListEdit(true)
                  }}>

            <span className="icon icon-plus icon-16px icon-left"/>
            ADD
          </button>
          <button className="btn btn-s btn-of-light-xs"
                  style={{justifySelf:'center'}}
                  onClick={() => onCodeListEdit(true)}>
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
          <Dropdown disabled={!parentCodeAvailable}
                    items={possibleParentCodeItems}
                    selection={selectedParentCode}
                    onChange={item => putNodeDefProp(nodeDef, 'parentCodeId', item.key)}/>
        </div>
      </FormItem>

    </React.Fragment>
  )
}

export default CodeListProps