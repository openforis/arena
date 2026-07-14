import './UserGroupsList.scss'

import React from 'react'
import { useNavigate } from 'react-router-dom'

import * as UserGroup from '@core/user/userGroup/userGroup'
import { appModuleUri, userModules } from '@webapp/app/appModules'
import { useSurveyId } from '@webapp/store/survey'
import Table from '@webapp/components/Table/Table'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

// See HeaderLeft.tsx for why userModules entries need casting when passed to appModuleUri.
type AppModule = Parameters<typeof appModuleUri>[0]

/**
 * User Groups list table, listing the user groups defined in the current survey.
 *
 * @returns {React.ReactElement} - The UserGroupsList component.
 */
const UserGroupsList = (): React.ReactElement => {
  const navigate = useNavigate()
  const surveyId = useSurveyId()

  const onRowClick = (userGroup: Record<string, unknown>): void =>
    navigate(`${appModuleUri(userModules.userGroup as AppModule)}${UserGroup.getUuid(userGroup)}`)

  return (
    <Table
      module="user-groups"
      moduleApiUri={`/api/survey/${surveyId}/user-groups`}
      className="user-groups-list"
      gridTemplateColumns="2fr 2fr 1fr 1fr"
      headerLeftComponent={HeaderLeft}
      rowHeaderComponent={RowHeader}
      rowComponent={Row}
      onRowClick={onRowClick}
    />
  )
}

export default UserGroupsList
