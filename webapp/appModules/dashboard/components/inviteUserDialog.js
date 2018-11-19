import './inviteUserDialog.scss'

import React from 'react'
import { connect } from 'react-redux'
import ReactDOM from 'react-dom'
import axios from 'axios'
import * as R from 'ramda'

import { Input } from '../../../commonComponents/form/input'
import Dropdown from '../../../commonComponents/form/dropdown'
import AutocompleteDialog from '../../../commonComponents/form/autocompleteDialog'

import { getSurvey } from '../../../survey/surveyState'
import { validEmail } from '../../../../common/user/userUtils'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../../commonComponents/modal'

import { toQueryString } from '../../../../server/serverUtils/request'

const UserAutocompleteItemRenderer = props => {
  const {item: user, ...otherProps} = props

  return <div {...otherProps}
              key={user.id}
              className="item"
              tabIndex="1">
    <div>{user.name} {user.email}</div>
  </div>
}

class InviteUserDialog extends React.Component {
  constructor (props) {
    super(props)

    this.emailInput = React.createRef()

    this.state = {
      email: '',
      autocompleteUsers: [],
      emailErrors: {},

      group: '',

      enableInvite: false,
      autocompleteOpened: false,
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

  onEmailAutocompleteClose () {
    this.setState({
      autocompleteOpened: false,
      autocompleteUsers: [],
    })
  }

  async onEmailChange (email) {
    const autocompleteOpened = !R.isEmpty(email)

    this.setState({
      email,
      emailErrors: validEmail(email) ? {} : {errors: ['Invalid email']},
      autocompleteOpened,
    })

    if (autocompleteOpened) {
      await this.loadUsers('email', email)
    }
  }

  onSelectedGroupChange (group) {
    this.setState({
      // group might be null
      group: R.prop('key', group),
    })
  }

  onUserSelect (userSearchResult) {
    this.onEmailChange(userSearchResult.email)
    this.onEmailAutocompleteClose()
  }

  async loadUsers (field, value) {
    const {surveyInfo, taxonomy} = this.props

    const params = {
      limit: 20,
      offset: 0,
      filter: {
        [field]: value
      }
    }

    const {data} = await axios.get(`/api/users?${toQueryString(params)}`)
    this.setState({autocompleteUsers: data})
  }

  render () {
    const {onInvite, onCancel, survey} = this.props
    const {autocompleteOpened, autocompleteUsers} = this.state
    const groups = R.map(
      g => ({key: g.id, name: g.name})
    )(survey.info.authGroups)

    const autocompleteDialog =
      autocompleteOpened
        ? ReactDOM.createPortal(
        <AutocompleteDialog className="xxx"
                            items={autocompleteUsers}
                            itemRenderer={UserAutocompleteItemRenderer}
                            itemKeyFunction={user => user.id}
                            inputField={this.emailInput.current.component.input}
                            onItemSelect={userSearchResult => this.onUserSelect(userSearchResult)}
                            onClose={() => this.onEmailAutocompleteClose()}/>,
        document.body
        )
        : null

    return (
      <Modal isOpen={true}>
        <ModalHeader>
          <h5 className="user-invite-dialog__header">Invite user</h5>
        </ModalHeader>

        <ModalBody>

          <div className="user-invite-dialog__body">
            <Input ref={this.emailInput}
                   className="email-input"
                   value={this.state.email}
                   disabled={false}
                   validation={this.state.emailErrors}
                   onChange={event => this.onEmailChange(event.target.value)}/>
            {autocompleteDialog}

            <Dropdown disabled={false}
                      items={groups}
                      itemKeyProp={'key'}
                      itemLabelProp={'name'}
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
  survey: getSurvey(state)
})

export default connect(mapStateToProps)(InviteUserDialog)
