import './deleteSurveyDialog.scss'

import React from 'react'
import Markdown from 'react-remarkable'

import AppContext from '../../../../../app/appContext'

import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '../../../../../commonComponents/modal'

class DeleteSurveyDialog extends React.Component {
  constructor (props) {
    super(props)

    this.state = { confirmName: '' }
    this.confirmNameOnChange = this.confirmNameOnChange.bind(this)
    this.confirmNameRef = React.createRef()
  }

  componentDidMount () {
    this.setState({ confirmName: '' })
    this.confirmNameRef.current.focus()
  }

  confirmNameOnChange (event) {
    this.setState({ confirmName: event.target.value })
  }

  render () {
    const { surveyName, onDelete, onCancel } = this.props
    const { i18n } = this.context

    return (
      <Modal isOpen={true} onClose={() => onCancel()}>
        <ModalHeader>
          <h5 className="survey-delete-dialog__header">{i18n.t('homeView.deleteSurveyDialog.areYouSure')}</h5>
        </ModalHeader>

        <ModalBody>
          <div className="survey-delete-dialog__body">
            <div className="highlight">
              <div>
                <Markdown>
                  {i18n.t('homeView.deleteSurveyDialog.deleteWarining', { surveyName })}
                </Markdown>
              </div>
              <div>{i18n.t('common.cantUndoWarning')}</div>
            </div>

            <div className="text-center">
              {i18n.t('homeView.deleteSurveyDialog.confirmName')}
            </div>

            <input type="text"
                   className="confirm-name"
                   value={this.state.confirmName}
                   onChange={this.confirmNameOnChange}
                   ref={this.confirmNameRef}/>
          </div>
        </ModalBody>

        <ModalFooter>
          <div>
            <button className="btn btn-of modal-footer__item"
                    onClick={onCancel}
                    aria-disabled={false}>
              <span className="icon icon-cross icon-12px icon-left"/>
              {i18n.t('common.cancel')}
            </button>

            <button className="btn btn-of btn-danger modal-footer__item"
                    onClick={onDelete}
                    aria-disabled={!(surveyName === this.state.confirmName)}>
              <span className="icon icon-bin icon-12px icon-left"/>
              {i18n.t('common.delete')}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    )
  }
}

DeleteSurveyDialog.contextType = AppContext

export default DeleteSurveyDialog