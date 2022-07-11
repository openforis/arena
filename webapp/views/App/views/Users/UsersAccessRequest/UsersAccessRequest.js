import './UsersAccessRequest.scss'

import React, { useCallback, useEffect, useState } from 'react'

import { Objects } from '@openforis/arena-core'

import * as UserAccessRequest from '@core/user/userAccessRequest'
import { Countries } from '@core/Countries'
import * as DateUtils from '@core/dateUtils'
import * as Survey from '@core/survey/survey'

import Table from '@webapp/components/Table/Table'
import PanelRight from '@webapp/components/PanelRight'

import { useI18n } from '@webapp/store/system'
import * as API from '@webapp/service/api'

import { Button } from '@webapp/components'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

import { TableHeaderLeft } from './TableHeaderLeft'
import { AcceptRequestPanel } from './AcceptRequestPanel'

const iconByStatus = ({ i18n }) => ({
  [UserAccessRequest.status.ACCEPTED]: (
    <span className="icon icon-checkmark accepted" title={i18n.t('usersAccessRequestView.status.ACCEPTED')} />
  ),
  [UserAccessRequest.status.CREATED]: (
    <span className="icon icon-clock pending" title={i18n.t('usersAccessRequestView.status.CREATED')} />
  ),
})

export const UsersAccessRequest = () => {
  const i18n = useI18n()

  const [requestedAt, setRequestedAt] = useState(Date.now())
  const [surveyTemplates, setSurveyTemplates] = useState([])
  const [currentUserAccessRequest, setCurrentUserAccessRequest] = useState(null)

  const columnContentRendererByFieldName = {
    [`props.${UserAccessRequest.keysProps.country}`]: ({ fieldValue }) =>
      Countries.getCountryName({ code: fieldValue }),
    [`props.${UserAccessRequest.keysProps.templateUuid}`]: ({ fieldValue, i18n }) => {
      if (!fieldValue) {
        return i18n.t('accessRequestView.templateNotSelected')
      }
      const template = surveyTemplates.find((t) => t.uuid === fieldValue)
      return Survey.getLabel(template, Survey.getDefaultLanguage(template))
    },
  }

  const onRowChange = useCallback(() => {
    // reload table content
    setRequestedAt(Date.now())
  }, [])

  useEffect(() => {
    const loadSurveyTemplates = async () => {
      const templates = await API.fetchSurveyTemplatesPublished()
      setSurveyTemplates(templates)
    }
    loadSurveyTemplates()
  }, [])

  return (
    <>
      <Table
        module="users-access-request"
        moduleApiUri="/api/users/users-access-request"
        restParams={{ requestedAt }}
        className="users-access-request-list"
        headerLeftComponent={TableHeaderLeft}
        columns={[
          ...UserAccessRequest.editableFields.map(({ name }) => ({
            key: name,
            header: `accessRequestView.fields.${name}`,
            renderItem: ({ item }) => {
              const fieldValue = Objects.path(name.split('.'))(item) || ''
              const renderer = columnContentRendererByFieldName[name]
              const label = renderer ? renderer({ fieldValue, i18n }) : fieldValue
              return <LabelWithTooltip key={name} label={label} />
            },
            width: name === 'email' ? '15rem' : '1fr',
          })),
          {
            key: 'dateCreated',
            header: 'common.dateCreated',
            renderItem: ({ item }) => DateUtils.formatDateTimeDisplay(UserAccessRequest.getDateCreated(item)),
            width: '10rem',
          },
          {
            key: 'status',
            header: 'common.status',
            renderItem: ({ item }) => iconByStatus({ i18n })[item.status],
            width: '5rem',
          },
          {
            key: 'accept',
            header: '',
            renderItem: ({ item }) =>
              item.status === UserAccessRequest.status.CREATED ? (
                <Button
                  label="usersAccessRequestView.acceptRequest.accept"
                  onClick={() => setCurrentUserAccessRequest(item)}
                />
              ) : null,
            width: '5rem',
          },
        ]}
      />

      {currentUserAccessRequest && (
        <PanelRight
          onClose={() => setCurrentUserAccessRequest(null)}
          header={i18n.t('usersAccessRequestView.acceptRequest.acceptRequestAndCreateSurvey')}
          width="600px"
        >
          <AcceptRequestPanel
            userAccessRequest={currentUserAccessRequest}
            onRequestAccepted={() => {
              onRowChange(currentUserAccessRequest)
              setCurrentUserAccessRequest(null)
            }}
          />
        </PanelRight>
      )}
    </>
  )
}
