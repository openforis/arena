import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ItemsView from './items/itemsView'
import CodeListEdit from '../codeListEdit/components/codeListEdit'

import Survey from '../../../../common/survey/survey'
import CodeList from '../../../../common/survey/codeList'

import { getSurvey } from '../../../survey/surveyState'
import { getCodeListEditCodeList } from '../codeListEdit/codeListEditState'
import { getSurveyForm } from '../surveyFormState'

import {
  createCodeListLevel,
  createCodeList,
  deleteCodeList,
  setCodeListForEdit,
} from '../codeListEdit/actions'

class CodeListsView extends React.Component {

  render () {

    const {
      codeLists, codeList, selectedItemUUID,
      createCodeList, deleteCodeList, onEdit, onSelect,
      onClose, canSelect, setCodeListForEdit
    } = this.props

    const canDeleteCodeList = codeList => codeList.usedByNodeDefs
      ? alert('This code list is used by some node definitions and cannot be removed')
      : window.confirm(`Delete the code list ${CodeList.getCodeListName(codeList)}? This operation cannot be undone.`)

    return <ItemsView headerText="Code lists"
                      itemEditComponent={CodeListEdit}
                      itemEditProp="codeList"
                      itemLabelFunction={codeList => CodeList.getCodeListName(codeList)}
                      editedItem={codeList}
                      items={codeLists}
                      selectedItemUUID={selectedItemUUID}
                      onAdd={createCodeList}
                      onEdit={setCodeListForEdit}
                      canDelete={canDeleteCodeList}
                      onDelete={deleteCodeList}
                      canSelect={canSelect}
                      onSelect={onSelect}
                      onClose={onClose}/>
  }
}

const mapStateToProps = (state) => {
  const survey = getSurvey(state)

  const codeLists = R.pipe(
    Survey.getCodeListsArray,
    R.map(codeList => ({
      ...codeList,
      usedByNodeDefs: Survey.getNodeDefsByCodeListUUID(codeList.uuid)(survey).length > 0
    }))
  )(survey)

  return {
    codeLists,
    codeList: getCodeListEditCodeList(survey)(getSurveyForm(state)),
  }
}

export default connect(
  mapStateToProps,
  {createCodeList, setCodeListForEdit, deleteCodeList, createCodeListLevel}
)(CodeListsView)