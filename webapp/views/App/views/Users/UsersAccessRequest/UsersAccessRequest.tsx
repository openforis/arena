import './UsersAccessRequest.scss'

import { ReactNode, useCallback, useEffect, useState } from 'react'

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
import { useIsMobile } from '@webapp/components/hooks/useIsMobile'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

import { TableHeaderLeft } from './TableHeaderLeft'
import { AcceptRequestPanel } from './AcceptRequestPanel'

type UserAccessRequestItem = UserAccessRequest.UserAccessRequest

type FieldRenderer = (params: { fieldValue: string; i18n: any }) => string

const iconByStatus = ({ i18n }: { i18n: any }): Partial<Record<string, ReactNode>> => ({
  [UserAccessRequest.status.ACCEPTED]: (
    <span className="icon icon-checkmark accepted" title={i18n.t('usersAccessRequestView.status.ACCEPTED')} />
  ),
  [UserAccessRequest.status.CREATED]: (
    <span className="icon icon-clock pending" title={i18n.t('usersAccessRequestView.status.CREATED')} />
  ),
})

// columns visible by default (the others can be shown using the visible columns menu)
const defaultVisibleFieldNames = new Set<string>([
  UserAccessRequest.keys.email,
  `props.${UserAccessRequest.keysProps.firstName}`,
  `props.${UserAccessRequest.keysProps.lastName}`,
  `props.${UserAccessRequest.keysProps.country}`,
])
const defaultVisibleFieldNamesMobile = new Set<string>([UserAccessRequest.keys.email])

// min widths let the table scroll horizontally on narrow screens instead of squeezing the columns
const fieldWidthByName: Record<string, string> = {
  [UserAccessRequest.keys.email]: 'minmax(12rem, 1.5fr)',
  [`props.${UserAccessRequest.keysProps.purpose}`]: 'minmax(12rem, 2fr)',
}
// on phones email, status and accept button must fit without scrolling
const fieldWidthByNameMobile: Record<string, string> = {
  [UserAccessRequest.keys.email]: 'minmax(7rem, 1fr)',
}
const defaultFieldWidth = 'minmax(8rem, 1fr)'

// date_modified is set when the request is accepted
const getDateAccepted = (item: UserAccessRequestItem) =>
  UserAccessRequest.getStatus(item) === UserAccessRequest.status.ACCEPTED
    ? UserAccessRequest.getDateModified(item)
    : null

export const UsersAccessRequest = () => {
  const i18n = useI18n()
  const isMobile = useIsMobile()

  const [requestedAt, setRequestedAt] = useState(() => Date.now())
  const [surveyTemplates, setSurveyTemplates] = useState<any[]>([])
  const [currentUserAccessRequest, setCurrentUserAccessRequest] = useState<UserAccessRequestItem | null>(null)

  const columnContentRendererByFieldName: Record<string, FieldRenderer> = {
    [`props.${UserAccessRequest.keysProps.country}`]: ({ fieldValue }) =>
      Countries.getCountryName({ code: fieldValue }),
    [`props.${UserAccessRequest.keysProps.templateUuid}`]: ({ fieldValue, i18n }) => {
      if (!fieldValue) {
        return i18n.t('guest:accessRequestView.templateNotSelected')
      }
      const template = surveyTemplates.find((t) => t.uuid === fieldValue)
      return Survey.getLabel(template, Survey.getDefaultLanguage(template))
    },
  }

  const visibleFieldNames: Set<string> = isMobile ? defaultVisibleFieldNamesMobile : defaultVisibleFieldNames

  const columns = [
    ...UserAccessRequest.editableFields.map(({ name }) => ({
      key: name,
      header: `guest:accessRequestView.fields.${name}`,
      hidden: !visibleFieldNames.has(name),
      renderItem: ({ item }: { item: UserAccessRequestItem }) => {
        const fieldValue = Objects.path(name.split('.'))(item) || ''
        const renderer = columnContentRendererByFieldName[name]
        const label = renderer ? renderer({ fieldValue, i18n }) : fieldValue
        return <LabelWithTooltip key={name} label={label} />
      },
      width: (isMobile ? fieldWidthByNameMobile[name] : null) ?? fieldWidthByName[name] ?? defaultFieldWidth,
    })),
    {
      key: 'dateCreated',
      header: 'common.dateCreated',
      hidden: isMobile,
      renderItem: ({ item }: { item: UserAccessRequestItem }) =>
        DateUtils.formatDateTimeDisplay(UserAccessRequest.getDateCreated(item)),
      width: '10rem',
    },
    {
      key: 'status',
      header: 'common.status',
      renderItem: ({ item }: { item: UserAccessRequestItem }) =>
        iconByStatus({ i18n })[UserAccessRequest.getStatus(item)],
      width: isMobile ? '4rem' : '5rem',
    },
    {
      key: 'acceptedBy',
      header: 'usersAccessRequestView.acceptedBy',
      hidden: isMobile,
      renderItem: ({ item }: { item: UserAccessRequestItem }) => (
        <LabelWithTooltip
          label={UserAccessRequest.getAcceptedByName(item) || UserAccessRequest.getAcceptedByEmail(item)}
        />
      ),
      width: defaultFieldWidth,
    },
    {
      key: 'dateAccepted',
      header: 'usersAccessRequestView.dateAccepted',
      hidden: true,
      renderItem: ({ item }: { item: UserAccessRequestItem }) => {
        const dateAccepted = getDateAccepted(item)
        return dateAccepted ? DateUtils.formatDateTimeDisplay(dateAccepted) : null
      },
      width: '10rem',
    },
    {
      key: 'createdSurvey',
      header: 'usersAccessRequestView.createdSurvey',
      hidden: true,
      renderItem: ({ item }: { item: UserAccessRequestItem }) => (
        <LabelWithTooltip label={UserAccessRequest.getCreatedSurveyName(item)} />
      ),
      width: defaultFieldWidth,
    },
    {
      key: 'accept',
      header: '',
      renderItem: ({ item }: { item: UserAccessRequestItem }) =>
        UserAccessRequest.getStatus(item) === UserAccessRequest.status.CREATED ? (
          <Button
            label="usersAccessRequestView.acceptRequest.accept"
            onClick={() => setCurrentUserAccessRequest(item)}
          />
        ) : null,
      width: '5.5rem',
    },
  ]

  const onRowChange = useCallback(() => {
    // reload table content
    setRequestedAt(Date.now())
  }, [])

  useEffect(() => {
    const loadSurveyTemplates = async () => {
      const templates = await API.fetchSurveyTemplatesPublished()
      setSurveyTemplates(templates)
    }
    void loadSurveyTemplates()
  }, [])

  return (
    <>
      <Table
        module="users-access-request"
        moduleApiUri="/api/users/users-access-request"
        restParams={{ requestedAt }}
        className="users-access-request-list"
        headerLeftComponent={TableHeaderLeft}
        columns={columns}
        selectable={false}
        visibleColumnsSelectionEnabled
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
              onRowChange()
              setCurrentUserAccessRequest(null)
            }}
          />
        </PanelRight>
      )}
    </>
  )
}
