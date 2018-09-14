import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { getSurveyCodeLists } from '../../../../common/survey/survey'
import { newCodeList } from '../../../../common/survey/codeList'

import { getSurvey } from '../../surveyState'
import { addCodeList } from '../../actions'
import CodeListEdit from './codeListEdit'

class CodeListsEdit extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      edit: false,
      editedCodeList: null,
    }
  }

  handleAddCodeList () {
    const codeList = newCodeList()

    this.props.addCodeList(codeList)

    this.setState({
      edit: true,
      editedCodeList: codeList,
    })
  }

  render () {
    const {survey} = this.props
    const {edit, editedCodeList} = this.state

    const codeLists = getSurveyCodeLists(survey)

    return (
      edit ?
        <CodeListEdit codeList={editedCodeList}/>
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
            R.empty(codeLists) ?
              <div>No code list added</div>
              : <div>
                TABLE (TODO)
              </div>
          }
        </React.Fragment>
    )
  }
}

const mapStateToProps = state => ({
  survey: getSurvey(state)
})

export default connect(mapStateToProps, {addCodeList})(CodeListsEdit)