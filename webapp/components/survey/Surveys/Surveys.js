import './Surveys.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as DateUtils from '@core/dateUtils'
import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'
import { appModuleUri, homeModules } from '@webapp/app/appModules'

import { useOnUpdate } from '@webapp/components/hooks'
import { SurveyActions, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import Table from '@webapp/components/Table'

import HeaderLeft from './HeaderLeft'

const Surveys = (props) => {
  const { module, moduleApiUri, template } = props

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const lang = useSurveyPreferredLang()
  const i18n = useI18n()

  /**
   * Parameter passed to table rest params
   * (used to reload table data on survey publish).
   */
  const [requestedAt, setRequestedAt] = useState(Date.now())

  // Redirect to dashboard on survey change
  useOnUpdate(() => {
    navigate(appModuleUri(homeModules.dashboard))
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
      className="surveys"
      module={module}
      moduleApiUri={moduleApiUri}
      restParams={{ lang, template, requestedAt, includeCounts: true }}
      headerLeftComponent={HeaderLeft}
      onRowClick={onRowClick}
      isRowActive={isRowActive}
      cellTestIdExtractor={({ column, item }) =>
        column.key === 'name' ? Survey.getName(Survey.getSurveyInfo(item)) : null
      }
      columns={[
        {
          key: 'active',
          renderItem: ({ active }) => (
            <span className={`icon icon-14px icon-action icon-radio-${active ? 'checked2' : 'unchecked'}`} />
          ),
          width: '50px',
        },
        {
          key: Survey.sortableKeys.name,
          header: 'common.name',
          renderItem: ({ item }) => Survey.getName(Survey.getSurveyInfo(item)),
          width: '1fr',
          sortable: true,
        },
        {
          key: Survey.sortableKeys.label,
          header: 'common.label',
          renderItem: ({ item }) => Survey.getLabel(Survey.getSurveyInfo(item), lang),
          width: '1fr',
          sortable: true,
        },
        {
          key: Survey.sortableKeys.ownerName,
          header: 'common.owner',
          renderItem: ({ item }) => Survey.getOwnerName(Survey.getSurveyInfo(item)),
          width: '15rem',
          sortable: true,
        },
        {
          key: Survey.sortableKeys.dateCreated,
          header: 'common.dateCreated',
          renderItem: ({ item }) => DateUtils.getRelativeDate(i18n, Survey.getDateCreated(Survey.getSurveyInfo(item))),
          width: '15rem',
          sortable: true,
        },
        {
          key: Survey.sortableKeys.dateModified,
          header: 'common.dateLastModified',
          renderItem: ({ item }) => DateUtils.getRelativeDate(i18n, Survey.getDateModified(Survey.getSurveyInfo(item))),
          width: '15rem',
          sortable: true,
        },
        {
          key: Survey.sortableKeys.status,
          header: 'common.status',
          renderItem: ({ item }) => Survey.getStatus(Survey.getSurveyInfo(item)),
          width: '15rem',
          sortable: true,
        },
        {
          key: 'nodeDefinitions',
          header: 'surveysView.nodeDefinitions',
          renderItem: ({ item }) => item.nodeDefsCount,
          width: '5rem',
        },
        ...(template
          ? []
          : [
              {
                key: 'records',
                header: 'surveysView.records',
                renderItem: ({ item }) => item.recordsCount,
                width: '5rem',
              },
              {
                key: 'chains',
                header: 'surveysView.chains',
                renderItem: ({ item }) => item.chainsCount,
                width: '5rem',
              },
            ]),
      ]}
      noItemsLabelForSearchKey="surveysView.noSurveysMatchingFilter"
      keyExtractor={({ item }) => Survey.getId(item)}
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
}

Surveys.defaultProps = {
  template: false,
}

export { Surveys }
