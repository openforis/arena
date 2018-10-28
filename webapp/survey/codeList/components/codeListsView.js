import './codeLists.scss'

import React from 'react'
import { connect } from 'react-redux'

import ItemsView from '../../../commonComponents/itemsView'
import CodeListEdit from './codeListEdit'

import { getNodeDefsByCodeListUUID, getSurveyCodeListsArray } from '../../../../common/survey/survey'
import { getCodeListName } from '../../../../common/survey/codeList'

import { getSurveyState } from '../../surveyState'
import { getCodeListEditCodeList } from '../codeListEditState'
import {
  createCodeList,
  setCodeListForEdit,
  deleteCodeList,
  putCodeListProp,
  createCodeListLevel
} from '../../codeList/actions'

const CodeListsView = (props) => {
  const {survey, codeList, selectedCodeListUUID, createCodeList, deleteCodeList, setCodeListForEdit, onSelect} = props

  const canDeleteCodeList = codeList => {
    if (getNodeDefsByCodeListUUID(codeList.uuid)(survey).length > 0) {
      alert('This code list is used by some node definitions and cannot be removed')
    } else {
      return window.confirm(`Delete the code list ${getCodeListName(codeList)}? This operation cannot be undone.`)
    }
  }

  const codeLists = getSurveyCodeListsArray(survey)

  return <ItemsView {...props}
                    headerText="Code lists"
                    itemEditComponent={CodeListEdit}
                    itemEditProp="codeList"
                    itemLabelFunction={codeList => getCodeListName(codeList)}
                    editedItem={codeList}
                    items={codeLists}
                    tableSelectedItemUUID={selectedCodeListUUID}
                    onAdd={createCodeList}
                    onEdit={setCodeListForEdit}
                    canDelete={canDeleteCodeList}
                    onDelete={deleteCodeList}
                    onSelect={onSelect}/>
}

const mapStateToProps = state => {
  const survey = getSurveyState(state)

  return {
    survey,
    codeList: getCodeListEditCodeList(survey),
  }
}

export default connect(
  mapStateToProps,
  {createCodeList, setCodeListForEdit, deleteCodeList, putCodeListProp, createCodeListLevel}
)(CodeListsView)