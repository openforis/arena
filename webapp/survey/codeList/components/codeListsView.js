import './codeLists.scss'

import React from 'react'
import { connect } from 'react-redux'

import CodeListEdit from './codeListEdit'
import CodeListsTable from './codeListsTable'

import { getSurvey } from '../../surveyState'
import { getCodeListEditCodeList } from '../codeListEditorState'

import { createCodeList, setCodeListForEdit, deleteCodeList } from '../../codeList/actions'

const Header = props => (
  <div className="code-lists__header">
    <h5>Code lists</h5>

    <button className="btn btn-s btn-of-light-xs"
            onClick={() => props.createCodeList()}>
      <span className="icon icon-plus icon-16px icon-left"/>
      ADD
    </button>
  </div>
)

const CodeListsView = (props) =>
  props.activeCodeList
    ? (
      <CodeListEdit/>
    )
    : (
      <React.Fragment>
        <Header {...props}/>
        <CodeListsTable {...props}/>
      </React.Fragment>
    )

const mapStateToProps = state => {
  const survey = getSurvey(state)

  return {
    survey,
    activeCodeList: getCodeListEditCodeList(survey),
  }
}

export default connect(
  mapStateToProps,
  {createCodeList, setCodeListForEdit, deleteCodeList}
)(CodeListsView)