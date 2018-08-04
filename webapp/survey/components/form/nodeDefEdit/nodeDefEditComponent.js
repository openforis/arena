import React from 'react'
import { connect } from 'react-redux'

import CommonPropsComponent from './commonPropsComponent'

import { getFormNodeDefEdit } from '../../../surveyState'

import { setFormNodDefEdit } from '../../../nodeDef/actions'

class NodeDefEditComponent extends React.Component {

  close () {
    const {setFormNodDefEdit} = this.props
    setFormNodDefEdit(null)
  }

  render () {
    const {nodeDef} = this.props

    return nodeDef
      ? <div className="survey-form__node-def-edit-wrapper">
        <div className="survey-form__node-def-edit">
          <CommonPropsComponent nodeDef={nodeDef}/>

          <div style={{justifySelf: 'center'}}>
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
  nodeDef: null,
}
const mapStateToProps = state => ({
  nodeDef: getFormNodeDefEdit(state)
})

export default connect(mapStateToProps, {setFormNodDefEdit})(NodeDefEditComponent)