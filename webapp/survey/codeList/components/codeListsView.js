import './codeLists.scss'

import React from 'react'
import { connect } from 'react-redux'

import CodeListEdit from './codeListEdit'
import CodeListsTable from './codeListsTable'

import { getSurvey } from '../../surveyState'
import { getCodeListEditCodeList } from '../codeListEditorState'

import {
  createCodeList,
  setCodeListForEdit,
  deleteCodeList,
  putCodeListProp,
  createCodeListLevel
} from '../../codeList/actions'

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

const CodeListsView = (props) => {
  const {codeList, onClose} = props

  return codeList
    ? (
      <CodeListEdit {...props}/>
    )
    : (
      <div className="code-lists">
        <Header {...props}/>
        <CodeListsTable {...props} codeList={null}/>
        {
          onClose
            ? <div style={{justifySelf: 'center'}}>
              <button className="btn btn-of-light"
                      onClick={() => {
                        onClose ? onClose() : null
                      }}>
                Close
              </button>
            </div>
            : null
        }
      </div>
    )
}

const mapStateToProps = state => {
  const survey = getSurvey(state)

  return {
    survey,
    codeList: getCodeListEditCodeList(survey),
  }
}

export default connect(
  mapStateToProps,
  {createCodeList, setCodeListForEdit, deleteCodeList, putCodeListProp, createCodeListLevel}
)(CodeListsView)