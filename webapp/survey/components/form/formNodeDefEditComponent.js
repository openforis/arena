import React from 'react'
import { connect } from 'react-redux'

import { getFormNodeDefEdit } from '../../surveyState'

import { setFormNodDefEdit } from '../../nodeDefActions'

class FormNodeDefEditComponent extends React.Component {

  close () {
    const {setFormNodDefEdit} = this.props
    setFormNodDefEdit(null)
  }

  render () {
    const {nodeDefEdit} = this.props

    return nodeDefEdit
      ? <div className="survey-form__node-def-edit-wrapper">
        <div className="survey-form__node-def-edit">
          <h4>{JSON.stringify(nodeDefEdit.uuid)}</h4>

          <div>
            <button className="btn btn-of-light"
                    onClick={() => this.close()}>Done
            </button>
          </div>

        </div>
      </div>
      : null

  }
}

FormNodeDefEditComponent.defaultProps = {
  nodeDefEdit: null,
}
const mapStateToProps = state => ({
  nodeDefEdit: getFormNodeDefEdit(state)
})

export default connect(mapStateToProps, {setFormNodDefEdit})(FormNodeDefEditComponent)