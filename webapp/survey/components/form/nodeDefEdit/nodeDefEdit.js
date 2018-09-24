import React from 'react'
import { connect } from 'react-redux'

import CommonProps from './commonProps'

import { getFormNodeDefEdit, getSurvey } from '../../../surveyState'

import { closeFormNodeDefEdit, putNodeDefProp } from '../../../nodeDef/actions'
import { createCodeList, editCodeList } from '../../../codeList/actions'

class NodeDefEdit extends React.Component {

  close () {
    const {nodeDef, closeFormNodeDefEdit} = this.props
    closeFormNodeDefEdit(nodeDef)
  }

  render () {
    const {nodeDef} = this.props

    return nodeDef
      ? (
        <div className="survey-form__node-def-edit">
          <div className="form">
            <CommonProps {...this.props} />

            <div style={{justifySelf: 'center'}}>
              <button className="btn btn-of-light"
                      onClick={() => this.close()}>Done
              </button>
            </div>

          </div>
        </div>
      )
      : null

  }
}

NodeDefEdit.defaultProps = {
  nodeDef: null,
}
const mapStateToProps = state => ({
  survey: getSurvey(state),
  nodeDef: getFormNodeDefEdit(state),
})

export default connect(
  mapStateToProps,
  {closeFormNodeDefEdit, putNodeDefProp, createCodeList, editCodeList}
)(NodeDefEdit)