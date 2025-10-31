import i18n from '@core/i18n/i18nFactory'
import * as AuthGroup from '@core/auth/authGroup'
import { Countries } from '@core/Countries'

import * as FlatDataWriter from '@server/utils/file/flatDataWriter'

import * as UserManager from '../manager/userManager'

const exportUsersIntoStream = async ({ outputStream, fileFormat }) => {
  const transformSurveyNames = (surveyNames) =>
    surveyNames
      ? Object.values(AuthGroup.groupNames).reduce(
          (acc, groupName) => acc.replaceAll(groupName, i18n.t(`auth:authGroups.${groupName}.label`)),
          surveyNames
        )
      : ''

  const transformTitle = (title) => (title ? i18n.t(`user.titleValues.${title}`) : '')

  const transformCountry = (countryCode) => (countryCode ? Countries.getCountryName({ code: countryCode }) : '')

  const fields = [
    'email',
    'name',
    'title',
    'country',
    'status',
    'system_administrator',
    'surveys',
    'invited_date',
    'access_request_date',
    'last_login_time',
  ]

  const objectTransformer = (obj) => ({
    ...obj,
    surveys: transformSurveyNames(obj.surveys),
    title: transformTitle(obj.title),
    country: transformCountry(obj.country),
  })
  await UserManager.fetchUsersIntoStream({
    processor: (dbStream) =>
      FlatDataWriter.writeItemsStreamToStream({
        stream: dbStream,
        fields,
        options: { objectTransformer },
        outputStream,
        fileFormat,
      }),
  })
}

export const UserExportService = {
  exportUsersIntoStream,
}
