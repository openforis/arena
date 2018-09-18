import React from 'react'
import * as R from 'ramda'

import { FormItem } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'

import {
  getSurveyCodeListById,
  getSurveyCodeListsArray,
} from '../../../../../common/survey/survey'

import {
  getCodeListId,
} from '../../../../../common/survey/nodeDef'

import {
  isRenderCheckbox,
  isRenderDropdown,
  nodeDefLayoutProps,
  nodeDefRenderType
} from '../../../../../common/survey/nodeDefLayout'

const newCodeList = (props) => {
  const {createCodeList, onCodeListEdit} = props

  createCodeList()

  onCodeListEdit(true)
}

const showCodeListsEditor = (props) => {
  const {onCodeListEdit} = props

  onCodeListEdit(true)
}

const CodeListProps = (props) => {

  const {survey, nodeDef, putNodeDefProp} = props

  const codeLists = getSurveyCodeListsArray(survey)

  const selectedCodeList = getSurveyCodeListById(getCodeListId(nodeDef))(survey)

  const parentCodeAvailable = R.path(['levels', 'length'], selectedCodeList) > 0 //hierarchical TODO
  const possibleParentCodeItems = []//isCodeList ? [] : [] //TODO
  const selectedParentCode = null//R.find(item => item.key === getNodeDefProp('parentCodeId')(nodeDef))(possibleParentCodeItems)

  return (
    <React.Fragment>
      <FormItem label={'Code List'}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '.8fr .1fr .1fr'
        }}>
          <Dropdown items={codeLists}
                    selection={selectedCodeList}
                    onChange={item => putNodeDefProp(nodeDef, 'codeListId', item.key)}/>
          <button className="btn btn-s btn-of-light-xs"
                  style={{marginLeft: '50px'}}
                  onClick={() => newCodeList(props)}>
            <span className="icon icon-plus icon-16px icon-left"/>
            ADD
          </button>
          <button className="btn btn-s btn-of-light-xs"
                  style={{marginLeft: '50px'}}
                  onClick={() => showCodeListsEditor(props)}>
            <span className="icon icon-list icon-16px icon-left"/>
            MANAGE
          </button>
        </div>
      </FormItem>
      <FormItem label={'Display As'}>
        <div style={{display: 'grid', gridTemplateColumns: '.1fr .1fr'}}>
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
        <Dropdown disabled={!parentCodeAvailable}
                  items={possibleParentCodeItems}
                  selection={selectedParentCode}
                  onChange={item => putNodeDefProp(nodeDef, 'parentCodeId', item.key)}/>
      </FormItem>
    </React.Fragment>
  )
}

export default CodeListProps