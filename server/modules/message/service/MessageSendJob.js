import { Messages, MessageNotificationType, MessageTarget, ServiceRegistry, MessageStatus } from '@openforis/arena-core'
import { ServerServiceType } from '@openforis/arena-server'

import Job from '@server/job/job'
import * as UserService from '@server/modules/user/service/userService'
import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'
import * as Mailer from '@server/utils/mailer'

export class MessageSendJob extends Job {
  constructor(params) {
    super(MessageSendJob.type, params)
  }

  async execute() {
    const { context, tx } = this
    const { message } = context

    const notificationTypes = Messages.getNotificationTypes(message)
    if (notificationTypes.includes(MessageNotificationType.Email)) {
      await this.notifyUsersByEmail()
    }
    // update message status to "Sent"
    const messageUpdated = Messages.assocStatus(MessageStatus.Sent)(message)
    const messageService = ServiceRegistry.getInstance().getService(ServerServiceType.message)
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

    const to = usersFiltered.map(User.getEmail)

    await Mailer.sendCustomEmail({ to, subject: Messages.getSubject(message), html: Messages.getBody(message) })
  }
}

MessageSendJob.type = 'MessageSendJob'
