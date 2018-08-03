import React from 'react'
import { connect } from 'react-redux'

import CommonPropsComponent from './commonPropsComponent'

import { getFormNodeDefEdit } from '../../../surveyState'

import { setFormNodDefEdit } from '../../../nodeDefActions'

class NodeDefEditComponent extends React.Component {

  close () {
    const {setFormNodDefEdit} = this.props
    setFormNodDefEdit(null)
  }

  render () {
    const {nodeDefEdit} = this.props

    return nodeDefEdit
      ? <div className="survey-form__node-def-edit-wrapper">
        <div className="survey-form__node-def-edit">
          <CommonPropsComponent/>

          <div style={{justifySelf:'center'}}>
            <button className="btn btn-of-light"
                    onClick={() => this.close()}>Done
            </button>
          </div>

        </div>
      </div>
      : null

  }
}

NodeDefEditComponent.defaultProps = {
  nodeDefEdit: null,
}
const mapStateToProps = state => ({
  nodeDefEdit: getFormNodeDefEdit(state)
})

export default connect(mapStateToProps, {setFormNodDefEdit})(NodeDefEditComponent)