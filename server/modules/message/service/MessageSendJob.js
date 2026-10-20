import { Messages, MessageNotificationType, MessageStatus } from '@openforis/arena-core'
import { ArenaServer, ServerServiceType } from '@openforis/arena-server'

import * as i18nFactory from '@core/i18n/i18nFactory'
import { parseMarkdown } from '@core/markdownUtils'

import Job from '@server/job/job'
import * as UserService from '@server/modules/user/service/userService'
import * as User from '@core/user/user'
import * as Mailer from '@server/utils/mailer'

const getMessageService = () => {
  // Ensure services are initialized
  const serviceRegistry = ArenaServer.initServices()
  return serviceRegistry.getService(ServerServiceType.message)
}

export default class MessageSendJob extends Job {
  constructor(params) {
    super(MessageSendJob.type, params)
    this.canceling = false
  }

  async cancel(options) {
    // cancel requested flag in JobBase is private: track it here to stop sending emails
    this.canceling = true
    return super.cancel(options)
  }

  isCancelingOrNotRunning() {
    return this.canceling || !this.isRunning()
  }

  async execute() {
    const { context, tx } = this
    const { messageUuid } = context

    this.logDebug(`fetching message ${messageUuid}`)
    const messageService = getMessageService()
    const message = await messageService.getByUuid(messageUuid, tx)
    if (!message) {
      throw new Error(`Message ${messageUuid} not found`)
    }
    this.setContext({ message })

    const notificationTypes = Messages.getNotificationTypes(message)
    this.logDebug(`message ${messageUuid} notification types: ${notificationTypes.join(', ')}`)

    if (notificationTypes.includes(MessageNotificationType.Email)) {
      await this.notifyUsersByEmail()
    }
    if (this.isCancelingOrNotRunning()) {
      this.logDebug(`job canceled: message ${messageUuid} status not updated`)
      return
    }
    // update message status to "Sent" (app notifications are shown to the users for sent messages)
    this.logDebug(`updating message ${messageUuid} status to ${MessageStatus.Sent}`)
    const messageUpdated = Messages.assocStatus(MessageStatus.Sent)(message)
    await messageService.update(message.uuid, messageUpdated, tx)
    this.logDebug(`message ${messageUuid} status updated`)
  }

  async notifyUsersByEmail() {
    const i18n = await i18nFactory.createI18nAsync()

    const { context, tx } = this
    const { message } = context

    this.logDebug('fetching target users')
    const users = await UserService.fetchUsers({ onlyAccepted: true }, tx)
    this.logDebug(`fetched ${users.length} accepted users`)

    const usersFiltered = users.filter((user) => Messages.isTargetingUser(user)(message))

    this.total = usersFiltered.length
    // notify the total right away (otherwise it's notified only when the first email has been sent)
    this.incrementProcessedItems(0)

    const subject = Messages.getSubject(message)
    this.logDebug(`sending ${this.total} emails (out of ${users.length} accepted users) for message ${subject}`)

    const bodyHtml = parseMarkdown(Messages.getBody(message))
    const messageWithBodyHtml = Messages.assocBody(bodyHtml)(message)

    for (const user of usersFiltered) {
      if (this.isCancelingOrNotRunning()) {
        this.logDebug(`job canceled after sending ${this.processed} of ${this.total} emails`)
        return
      }
      const messageWithReplacedVariables = Messages.replaceBodyTemplateVariables({ i18n, user })(messageWithBodyHtml)
      const bodyHtmlWithReplacedVariables = Messages.getBody(messageWithReplacedVariables)
      const to = User.getEmail(user)
      const userUuid = User.getUuid(user)
      this.logDebug(`sending email ${this.processed + 1}/${this.total} to user ${userUuid}`)
      try {
        await Mailer.sendCustomEmail({ to, subject, html: bodyHtmlWithReplacedVariables, log: false }) // NOSONAR
      } catch (error) {
        this.logError(`error sending email to user ${userUuid}: ${error.message}`)
        throw error
      }
      this.incrementProcessedItems()
    }

    this.logDebug(`sent ${this.processed} emails for message ${subject}`)
  }
}

MessageSendJob.type = 'MessageSendJob'
