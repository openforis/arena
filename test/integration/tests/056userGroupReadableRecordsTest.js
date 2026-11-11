import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as RecordService from '@server/modules/record/service/recordService'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { getContextUser } from '../config/context'

import {
  createSurveyWithUserGroupRecords,
  deleteSurveyWithUserGroupRecords,
  registerUserGroupServiceTest,
  restoreUserGroupService,
} from './_record/userGroupRecordsTestUtils'

// Records of the groups listed in readableGroupUuids of the user's group are listed as read-only,
// records of other groups are not listed at all.

let survey = null
let userGroupServicePrev = null

const fetchSummariesByClusterNo = async (user = getContextUser()) => {
  const { list } = await RecordManager.fetchRecordsSummaryBySurveyId({
    surveyId: Survey.getId(survey),
    cycle: Survey.cycleOneKey,
    user,
  })
  return Object.fromEntries(list.map((summary) => [Number(summary.clusterNo), summary]))
}

describe('User group readable groups', () => {
  beforeAll(async () => {
    userGroupServicePrev = registerUserGroupServiceTest()
    survey = (await createSurveyWithUserGroupRecords(getContextUser())).survey
  })

  afterAll(async () => {
    await deleteSurveyWithUserGroupRecords({ user: getContextUser(), survey })
    restoreUserGroupService(userGroupServicePrev)
  })

  test('own group records are editable, readable groups records are read-only, others are hidden', async () => {
    const summariesByClusterNo = await fetchSummariesByClusterNo()

    expect(Object.keys(summariesByClusterNo).sort((a, b) => a.localeCompare(b))).toEqual(['1', '2'])
    expect(Record.isReadOnly(summariesByClusterNo[1])).toBe(false)
    expect(Record.isReadOnly(summariesByClusterNo[2])).toBe(true)
  })

  test('count includes the records of the readable groups', async () => {
    const count = await RecordManager.countRecordsBySurveyId({
      surveyId: Survey.getId(survey),
      cycle: Survey.cycleOneKey,
      user: getContextUser(),
    })
    expect(count).toBe(2)
  })

  test('records of readable groups are checked in as read-only', async () => {
    const summariesByClusterNo = await fetchSummariesByClusterNo()
    const record = await RecordService.checkIn({
      user: getContextUser(),
      surveyId: Survey.getId(survey),
      recordUuid: Record.getUuid(summariesByClusterNo[2]),
      draft: false,
    })
    expect(Record.isReadOnly(record)).toBe(true)
  })

  test('access filters', async () => {
    const surveyWithDefs = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: Survey.getId(survey),
      cycle: Survey.cycleOneKey,
    })
    const { own, readable } = await SurveyManager.fetchUserGroupAccessFilters({
      user: getContextUser(),
      survey: surveyWithDefs,
    })
    expect(own.map(({ value }) => value)).toEqual(['control'])
    expect(readable.map((filters) => filters.map(({ value }) => value))).toEqual([['contractor_a']])
  })

  test('guest: records of the user groups are listed, all read-only', async () => {
    const guestGroup = Survey.getAuthGroupByName(AuthGroup.groupNames.surveyGuest)(Survey.getSurveyInfo(survey))
    expect(AuthGroup.getPermissions(guestGroup)).toEqual([AuthGroup.permissions.recordView])

    // same user (member of the control group), with the guest role only
    const guest = { ...getContextUser(), authGroups: [guestGroup] }
    const summariesByClusterNo = await fetchSummariesByClusterNo(guest)

    expect(Object.keys(summariesByClusterNo).sort((a, b) => a.localeCompare(b))).toEqual(['1', '2'])
    expect(Record.isReadOnly(summariesByClusterNo[1])).toBe(true)
    expect(Record.isReadOnly(summariesByClusterNo[2])).toBe(true)
  })
})
