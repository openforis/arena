import React, { useEffect, useContext, useState, useMemo } from 'react'

import * as User from '@core/user/user'
import { convertDateFromISOToDisplay } from '@core/dateUtils'

import { AreaChart } from '@webapp/charts/AreaChart'
import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'
import { useAuthCanViewAllUsers } from '@webapp/store/user/hooks'

import { RecordsSummaryContext } from '../RecordsSummaryContext'
import RecordsSummaryPeriodSelector from '../RecordsSummaryPeriodSelector'
import { NoRecordsAddedInSelectedPeriod } from '../NoRecordsAddedInSelectedPeriod'

const dayInMs = 1000 * 60 * 60 * 24

const calculateDateData = (userDateCounts) => {
  let firstDate, lastDate, daysDiff
  if (userDateCounts && userDateCounts.length > 0) {
    firstDate = new Date(userDateCounts[0].date)
    lastDate = new Date(userDateCounts[userDateCounts.length - 1].date)
    daysDiff = Math.ceil((lastDate - firstDate) / dayInMs) + 1
  } else {
    daysDiff = 15
    lastDate = new Date()
    firstDate = new Date()
    firstDate.setDate(lastDate.getDate() - daysDiff - 1)
  }
  return { firstDate, lastDate, daysDiff }
}

const groupDataByDate = (userDateCounts) =>
  userDateCounts.reduce((acc, item) => {
    const { count, date } = item
    const key = getDataKey(item)
    const dateFormatted = convertDateFromISOToDisplay(date)
    let obj = acc[dateFormatted]
    if (!obj) {
      obj = { date: dateFormatted }
      acc[dateFormatted] = obj
    }
    obj[key] = Number(count)
    return acc
  }, {})

const generateChartData = ({ dataKeys, userDateCounts }) =>
  dataKeys.length > 0 ? Object.values(groupDataByDate(userDateCounts)) : []

const getDataKey = (item) => {
  const { owner_name, owner_email } = item
  return owner_name ?? owner_email.substring(0, owner_email.indexOf('@'))
}

const DailyRecordsByUser = () => {
  const i18n = useI18n()
  const { userDateCounts, userCounts } = useContext(RecordsSummaryContext)
  const [selectedUsers, setSelectedUsers] = useState([])
  const canViewAllUsers = useAuthCanViewAllUsers()
  const user = useUser()

  // Sort userCounts in descending order based on count
  const sortedUserCounts = [...userCounts].sort((a, b) => b.count - a.count)

  const chartData = useMemo(() => {
    const { firstDate, daysDiff } = calculateDateData(userDateCounts)

    const dataKeys = selectedUsers.map(getDataKey)

    const data = generateChartData({ dataKeys, firstDate, daysDiff, userDateCounts })

    return { data, dataKeys }
  }, [selectedUsers, userDateCounts])

  const { data, dataKeys } = chartData

  useEffect(() => {
    if (!canViewAllUsers) {
      const selectedItem = userCounts.find((item) => item.owner_uuid === User.getUuid(user))
      setSelectedUsers(selectedItem ? [selectedItem] : [])
    }
  }, [user, canViewAllUsers, userCounts])

  return (
    <>
      <h4 className="dashboard-chart-header">{i18n.t('homeView.dashboard.dailyRecordsByUser')}</h4>

      <RecordsSummaryPeriodSelector />

      {canViewAllUsers && sortedUserCounts?.length > 0 && (
        <Dropdown
          multiple
          items={sortedUserCounts}
          itemLabel={(user) => user.owner_name ?? user.owner_email}
          itemValue={(user) => user.owner_uuid}
          onChange={(selectedOptions) => setSelectedUsers(selectedOptions)}
          placeholder={i18n.t('homeView.dashboard.selectUsers')}
        />
      )}
      {dataKeys.length === 0 ? (
        <NoRecordsAddedInSelectedPeriod />
      ) : data.length > 0 ? (
        <AreaChart allowDecimals={false} data={data} dataKeys={dataKeys} labelDataKey="date" />
      ) : null}
    </>
  )
}

export default DailyRecordsByUser
