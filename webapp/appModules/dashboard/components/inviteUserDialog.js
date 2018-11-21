import './inviteUserDialog.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { Input } from '../../../commonComponents/form/input'
import Dropdown from '../../../commonComponents/form/dropdown'

import Survey from '../../../../common/survey/survey'
import { getStateSurveyInfo } from '../../../survey/surveyState'
import { validEmail } from '../../../../common/user/user'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../../commonComponents/modal'

class InviteUserDialog extends React.Component {
  constructor (props) {
    super(props)

    this.emailInput = React.createRef()

    this.state = {
      email: '',
      emailErrors: {},
      groupErrors: {},
      group: '',
      enableInvite: false,
    }
  }

  componentDidMount () {
    this.emailInput.current.focus()
  }

  componentDidUpdate (_, prevState) {
    if (prevState.email !== this.state.email
      || prevState.group !== this.state.group) {
      this.setState({enableInvite: validEmail(this.state.email) && this.state.group})
    }
  }

  onEmailChange (email) {
    this.setState({
      email,
      emailErrors: validEmail(email) ? {} : {errors: ['Invalid email']},
    })
  }

  onSelectedGroupChange (group) {
    this.setState({
      group: R.prop('key', group),
      groupErrors: group ? {} : {valid: false, errors: ['Invalid group name']}
    })
  }

  render () {
    const {onInvite, onCancel, surveyInfo} = this.props

    const groups = Survey.getAuthGroups(surveyInfo)
    const lang = Survey.getDefaultLanguage(surveyInfo)

    return (
      <Modal isOpen={true} closeOnEsc={true} onClose={onCancel}>
        <ModalHeader>
          <h5 className="user-invite-dialog__header">Invite user</h5>
        </ModalHeader>

        <ModalBody>
          <div className="user-invite-dialog__body">
            <Input ref={this.emailInput}
                   value={this.state.email}
                   disabled={false}
                   validation={this.state.emailErrors}
                   onChange={event => this.onEmailChange(event.target.value)}/>

            <Dropdown disabled={false}
                      items={groups}
                      itemKeyProp="id"
                      itemLabelFunction={group => R.path(['labels', lang], group)}
                      validation={this.state.groupErrors}
                      selection={null}
                      onChange={group => this.onSelectedGroupChange(group)}
                      placeholder="User's group"/>
          </div>
        </ModalBody>

        <ModalFooter>
          <div>
            <button className="btn btn-of modal-footer__item"
                    onClick={onCancel}>
              <span className="icon icon-cross icon-12px icon-left"/>
              Cancel
            </button>

            <button className="btn btn-of modal-footer__item"
                    onClick={onInvite}
                    aria-disabled={!this.state.enableInvite}>
              <span className="icon icon-user-plus icon-12px icon-left"/>
              Invite
            </button>
          </div>
        </ModalFooter>
      </Modal>
    )
  }
}

const mapStateToProps = state => ({
  surveyInfo: getStateSurveyInfo(state)
})

export default connect(mapStateToProps)(InviteUserDialog)
