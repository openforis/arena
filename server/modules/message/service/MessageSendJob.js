import { Messages, MessageNotificationType, MessageTarget, MessageStatus, Objects } from '@openforis/arena-core'
import { ArenaServer, ServerServiceType } from '@openforis/arena-server'

import Job from '@server/job/job'
import * as UserService from '@server/modules/user/service/userService'
import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'
import * as Mailer from '@server/utils/mailer'

const getMessageService = () => {
  // Ensure services are initialized
  const serviceRegistry = ArenaServer.initServices()
  return serviceRegistry.getService(ServerServiceType.message)
}

/**
 * Replace template variables in message body.
 * Template variables:
 * - {{userTitleAndFirstName}}: replaced with user's title and first name (e.g. "Dr. John")
 * - {{userFirstName}}: replaced with user's first name (e.g. "John").
 * @param {!object} params - Parameters object.
 * @param {!string} params.body - Message body.
 * @param {!object} params.user - User object.
 * @returns {string} - Message body with template variables replaced.
 */
const replaceBodyTemplateVariables = ({ body, user }) => {
  const title = User.getTitle(user)
  const firstName = User.getFirstName(user)
  const titleAndNameParts = []
  if (Objects.isNotEmpty(firstName)) {
    titleAndNameParts.push(firstName)
  }
  if (Objects.isNotEmpty(title)) {
    titleAndNameParts.unshift(title)
  }
  const userTitleAndFirstName = titleAndNameParts.length > 0 ? titleAndNameParts.join(' ') : 'User'
  let bodyFixed = body.replaceAll('{{userTitleAndFirstName}}', userTitleAndFirstName)
  bodyFixed = bodyFixed.replaceAll('{{userFirstName}}', firstName ?? 'User')
  return bodyFixed
}

export default class MessageSendJob extends Job {
  constructor(params) {
    super(MessageSendJob.type, params)
  }

  async execute() {
    const { context, tx } = this
    const { messageUuid } = context

    const messageService = getMessageService()
    const message = await messageService.getByUuid(messageUuid, tx)
    this.setContext({ message })

    const notificationTypes = Messages.getNotificationTypes(message)
    if (notificationTypes.includes(MessageNotificationType.Email)) {
      await this.notifyUsersByEmail()
    }
    // update message status to "Sent"
    const messageUpdated = Messages.assocStatus(MessageStatus.Sent)(message)
    await messageService.update(message.uuid, messageUpdated, tx)
  }

  async notifyUsersByEmail() {
    const { context, tx } = this
    const { message } = context

    const targets = Messages.getTargets(message)
    const excludedEmails = Messages.getTargetExcludedUserEmails(message)
    const users = await UserService.fetchUsers({ onlyAccepted: true }, tx)

    const usersFiltered = targets.some(MessageTarget.All)
      ? users
      : users.filter(
          (user) =>
            (!excludedEmails || !excludedEmails.includes(User.getEmail(user))) &&
            ((targets.includes(MessageTarget.SystemAdmins) && User.isSystemAdmin(user)) ||
              (targets.includes(MessageTarget.SurveyManagers) && User.isSurveyManager(user)) ||
              (targets.includes(MessageTarget.DataEditors) &&
                !!User.getAuthGroupByName(AuthGroup.groupNames.dataEditor)(user)))
        )

    this.total = usersFiltered.length

    for (const user of usersFiltered) {
      const body = replaceBodyTemplateVariables({ body: Messages.getBody(message), user })
      const subject = Messages.getSubject(message)
      const to = User.getEmail(user)
      await Mailer.sendCustomEmail({ to, subject, html: body })
    }
  }
}

MessageSendJob.type = 'MessageSendJob'
