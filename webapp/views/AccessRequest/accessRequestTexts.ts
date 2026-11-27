import * as ProcessUtils from '@core/processUtils'
import type { IconName } from '@webapp/components/AppIcon/iconComponents'

type AccessRequestTexts = {
  title: string
  introduction: string
  submit: string
  submitIcon?: IconName
  submitConfirm: string
  sent: string
  sentMessage: string
  error: string
}

const accessRequestTexts: AccessRequestTexts = {
  title: 'guest:accessRequestView.title',
  introduction: 'guest:accessRequestView.introduction',
  submit: 'guest:accessRequestView.sendRequest',
  submitIcon: 'mail',
  submitConfirm: 'guest:accessRequestView.sendRequestConfirm',
  sent: 'guest:accessRequestView.requestSent',
  sentMessage: 'guest:accessRequestView.requestSentMessage',
  error: 'guest:accessRequestView.error',
}

const registrationTexts: AccessRequestTexts = {
  title: 'guest:registrationView.title',
  introduction: 'guest:registrationView.introduction',
  submit: 'guest:registrationView.createAccount',
  submitConfirm: 'guest:registrationView.createAccountConfirm',
  sent: 'guest:registrationView.accountCreated',
  sentMessage: 'guest:registrationView.accountCreatedMessage',
  error: 'guest:registrationView.error',
}

/**
 * Returns the i18n keys of the texts of the access request form: with self-registration the form creates the account.
 */
export const getAccessRequestTexts = (): AccessRequestTexts =>
  ProcessUtils.ENV.userSelfRegistration ? registrationTexts : accessRequestTexts
