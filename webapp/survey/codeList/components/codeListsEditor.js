import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import CodeListEditor from './codeListEditor'
import CodeListsTable from './codeListsTable'

import {getCodeListName} from '../../../../common/survey/codeList'

import { createCodeList, editCodeList, deleteCodeList } from '../../codeList/actions'
import { getSurvey } from '../../surveyState'
import { getCodeListsArray, getCodeListEditorCodeList } from '../codeListEditorState'

class CodeListsEditor extends React.Component {

  handleAddCodeList () {
    this.props.createCodeList()
  }

  handleDeleteCodeList (codeList) {
    if (window.confirm(`DELETE THE CODE LIST ${getCodeListName(codeList)}?`)) {
      this.props.deleteCodeList(codeList.uuid)
    }
  }

  render () {
    const {codeLists, editedCodeList, editCodeList} = this.props

    return (
      editedCodeList ?
        <CodeListEditor/>
        :
        <React.Fragment>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
          }}>

            <label>Code lists</label>

            <button className="btn btn-s btn-of-light-xs"
                    style={{marginLeft: '50px'}}
                    onClick={() => this.handleAddCodeList()}>
              <span className="icon icon-plus icon-16px icon-left"/>
              ADD
            </button>

          </div>

          {
            R.isEmpty(codeLists)
              ? <div>No code list added</div>
              : <CodeListsTable codeLists={codeLists}
                                editCodeList={editCodeList}
                                deleteCodeList={(codeList) => this.handleDeleteCodeList(codeList)} />
          }
        </React.Fragment>
    )
  }
}

const mapStateToProps = state => {
  const survey = getSurvey(state)

  return {
    survey,
    codeLists: getCodeListsArray(survey),
    editedCodeList: getCodeListEditorCodeList(survey),
  }
}

export default connect(mapStateToProps, {createCodeList, editCodeList, deleteCodeList})(CodeListsEditor)