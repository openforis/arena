import i18n from '@core/i18n/i18nFactory'
import * as AuthGroup from '@core/auth/authGroup'
import { Countries } from '@core/Countries'

import * as CSVWriter from '@server/utils/file/csvWriter'

import * as UserManager from '../manager/userManager'

const exportUsersIntoStream = async ({ outputStream }) => {
  const transformSurveyNames = (surveyNames) =>
    surveyNames
      ? Object.values(AuthGroup.groupNames).reduce(
          (acc, groupName) => acc.replaceAll(groupName, i18n.t(`authGroups.${groupName}.label`)),
          surveyNames
        )
      : ''

  const transformTitle = (title) => (title ? i18n.t(`user.titleValues.${title}`) : '')

  const transformCountry = (countryCode) => (countryCode ? Countries.getCountryName({ code: countryCode }) : '')

  const headers = [
    'email',
    'name',
    'title',
    'country',
    'status',
    'system_administrator',
    'surveys',
    'invited_date',
    'last_login_time',
  ]

  const objectTransformer = (obj) => ({
    ...obj,
    surveys: transformSurveyNames(obj.surveys),
    title: transformTitle(obj.title),
    country: transformCountry(obj.country),
  })

  const transformer = CSVWriter.transformJsonToCsv({ fields: headers, options: { objectTransformer } })
  transformer.pipe(outputStream)
  await UserManager.fetchUsersIntoStream({ transformer })
}

export const UserExportService = {
  exportUsersIntoStream,
}
