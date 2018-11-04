import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ItemsView from './items/itemsView'
import CodeListEdit from '../codeListEdit/components/codeListEdit'

import { getSurvey } from '../../../survey/surveyState'
import { getCodeListsArray, getNodeDefsByCodeListUUID } from '../../../../common/survey/survey'

import { getCodeListName } from '../../../../common/survey/codeList'

import { getCodeListEditCodeList } from '../codeListEdit/codeListEditState'

import {
  createCodeListLevel,
  createCodeList,
  deleteCodeList,
  putCodeListProp,
  setCodeListForEdit
} from '../codeListEdit/actions'

import { fetchCodeLists } from '../../../survey/codeLists/actions'
import { getSurveyForm } from '../surveyFormState'

class CodeListsView extends React.Component {

  componentDidMount () {
    const {fetchOnMount, fetchCodeLists} = this.props
    //for now only from designer, draft = true
    if (fetchOnMount)
      fetchCodeLists(true)
  }

  render () {

    const {
      codeLists, codeList, selectedCodeListUUID,
      createCodeList, deleteCodeList, setCodeListForEdit, onSelect
    } = this.props

    const canDeleteCodeList = codeList => codeList.usedByNodeDefs
      ? alert('This code list is used by some node definitions and cannot be removed')
      : window.confirm(`Delete the code list ${getCodeListName(codeList)}? This operation cannot be undone.`)

    return <ItemsView {...this.props}
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
}

CodeListsView.defaultProps = {
  fetchOnMount: true,
}

const mapStateToProps = (state) => {
  const survey = getSurvey(state)

  const codeLists = R.pipe(
    getCodeListsArray,
    R.map(codeList => ({
      ...codeList,
      usedByNodeDefs: getNodeDefsByCodeListUUID(codeList.uuid)(survey).length > 0
    }))
  )(survey)

  return {
    codeLists,
    codeList: getCodeListEditCodeList(survey)(getSurveyForm(state)),
  }
}

export default connect(
  mapStateToProps,
  {fetchCodeLists, createCodeList, setCodeListForEdit, deleteCodeList, putCodeListProp, createCodeListLevel}
)(CodeListsView)