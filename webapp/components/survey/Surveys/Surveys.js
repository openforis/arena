import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as DateUtils from '@core/dateUtils'
import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'
import { appModuleUri, homeModules } from '@webapp/app/appModules'

import { useOnUpdate } from '@webapp/components/hooks'
import { SurveyActions, useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import Table from '@webapp/components/Table'

import HeaderLeft from './HeaderLeft'

const Surveys = (props) => {
  const { module, moduleApiUri, template, title } = props

  const dispatch = useDispatch()
  const history = useHistory()
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()

  /**
   * Parameter passed to table rest params
   * (used to reload table data on survey publish).
   */
  const [requestedAt, setRequestedAt] = useState(Date.now())

  // Redirect to dashboard on survey change
  useOnUpdate(() => {
    history.push(appModuleUri(homeModules.dashboard))
  }, [Survey.getUuid(surveyInfo)])

  // reload table data on survey publish
  useOnUpdate(() => {
    setRequestedAt(Date.now())
  }, [Survey.getStatus(surveyInfo)])

  const onRowClick = (surveyRow) => {
    const canEdit = Authorizer.canEditSurvey(user, surveyRow)
    dispatch(SurveyActions.setActiveSurvey(Survey.getId(surveyRow), canEdit))
  }

  const isRowActive = (surveyRow) => Survey.getId(surveyRow) === Survey.getIdSurveyInfo(surveyInfo)

  return (
    <Table
      module={module}
      moduleApiUri={moduleApiUri}
      restParams={{ template, requestedAt }}
      headerLeftComponent={() => HeaderLeft({ title })}
      onRowClick={onRowClick}
      isRowActive={isRowActive}
      columns={[
        {
          key: 'active',
          renderItem: ({ active }) => (
            <span className={`icon icon-14px icon-action icon-radio-${active ? 'checked2' : 'unchecked'}`} />
          ),
          width: '50px',
        },
        { key: 'name', header: 'common.name', renderItem: ({ item }) => Survey.getName(Survey.getSurveyInfo(item)) },
        {
          key: 'owner',
          header: 'common.owner',
          renderItem: ({ item }) => Survey.getOwnerName(Survey.getSurveyInfo(item)),
          width: '1.5fr',
        },
        {
          key: 'label',
          header: 'common.label',
          renderItem: ({ item }) => Survey.getOwnerName(Survey.getSurveyInfo(item)),
          width: '1.5fr',
        },
        {
          key: 'dateCreated',
          header: 'common.dateCreated',
          renderItem: ({ item }) => DateUtils.getRelativeDate(i18n, Survey.getDateCreated(Survey.getSurveyInfo(item))),
          width: '1.5fr',
        },
        {
          key: 'dateLastModified',
          header: 'common.dateLastModified',
          renderItem: ({ item }) => DateUtils.getRelativeDate(i18n, Survey.getDateModified(Survey.getSurveyInfo(item))),
          width: '1.5fr',
        },
        {
          key: 'status',
          header: 'common.status',
          renderItem: ({ item }) => Survey.getStatus(Survey.getSurveyInfo(item)),
          width: '1.5fr',
        },
      ]}
    />
  )
}

Surveys.propTypes = {
  /**
   * Module name.
   */
  module: PropTypes.string.isRequired,
  /**
   * Module API URI.
   */
  moduleApiUri: PropTypes.string.isRequired,
  /**
   * If true, show only survey templates.
   */
  template: PropTypes.bool,
  /**
   * Title to be shown in the top header.
   */
  title: PropTypes.string.isRequired,
}

Surveys.defaultProps = {
  template: false,
}

export { Surveys }
