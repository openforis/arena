import './UsersList.scss'

import React, { useCallback } from 'react'
import { useHistory } from 'react-router-dom'

import * as User from '@core/user/user'
import { appModuleUri, userModules } from '@webapp/app/appModules'
import { useAuthCanViewOtherUsersEmail } from '@webapp/store/user'
import { useSurveyId } from '@webapp/store/survey'
import Table from '@webapp/components/Table/Table'

import HeaderLeft from './HeaderLeft'
import RowHeader from './RowHeader'
import Row from './Row'

const UsersListSurvey = () => {
  const history = useHistory()
  const surveyId = useSurveyId()
  const emailVisible = useAuthCanViewOtherUsersEmail()

  const onRowClick = useCallback(
    (user) => history.push(`${appModuleUri(userModules.user)}${User.getUuid(user)}`),
    [history]
  )

  return (
    <Table
      module="users-survey"
      moduleApiUri={`/api/survey/${surveyId}/users`}
      className="users-list"
      gridTemplateColumns={`35px repeat(${emailVisible ? 5 : 4}, 1fr) 10rem 50px`}
      headerLeftComponent={HeaderLeft}
      rowHeaderComponent={(headerProps) => RowHeader({ ...headerProps, emailVisible })}
      rowComponent={(rowProps) => Row({ ...rowProps, emailVisible })}
      onRowClick={onRowClick}
    />
  )
}

export default UsersListSurvey
