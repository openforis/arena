import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import CodeListEditor from './codeListEditor'

import { getSurveyCodeListsArray } from '../../../../common/survey/survey'

import { createCodeList, editCodeList, deleteCodeList } from '../../codeList/actions'
import { getSurvey } from '../../surveyState'
import { getCodeListsEditorEditedCodeList } from '../codeListsEditorState'
import CodeListsTable from './codeListsTable'

class CodeListsEditor extends React.Component {

  handleAddCodeList () {
    this.props.createCodeList()
  }

  render () {
    const {survey, editedCodeList, editCodeList, deleteCodeList} = this.props

    const codeLists = getSurveyCodeListsArray(survey)

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
                                deleteCodeList={deleteCodeList} />
          }
        </React.Fragment>
    )
  }
}

const mapStateToProps = state => {
  const survey = getSurvey(state)

  return {
    survey,
    editedCodeList: getCodeListsEditorEditedCodeList(survey),
  }
}

export default connect(mapStateToProps, {createCodeList, editCodeList, deleteCodeList})(CodeListsEditor)