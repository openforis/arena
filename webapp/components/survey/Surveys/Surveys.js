import './Surveys.scss'

import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as DateUtils from '@core/dateUtils'
import * as Survey from '@core/survey/survey'
import * as Authorizer from '@core/auth/authorizer'
import { appModuleUri, homeModules } from '@webapp/app/appModules'

import { useBrowserLanguageCode, useOnUpdate } from '@webapp/components/hooks'
import { SurveyActions, useSurveyInfo } from '@webapp/store/survey'
import { useUser, useUserIsSystemAdmin } from '@webapp/store/user'

import Table from '@webapp/components/Table'
import { TableCellFiles } from '@webapp/components/Table/TableCellFiles'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

import HeaderLeft from './HeaderLeft'
import { RecordsCountIcon } from './RecordsCountIcon'

const Surveys = (props) => {
  const { module, moduleApiUri, template } = props

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useUser()
  const surveyInfo = useSurveyInfo()
  const lang = useBrowserLanguageCode()
  const isSystemAdmin = useUserIsSystemAdmin()

  /**
   * Parameter passed to table rest params
   * (used to reload table data on survey publish).
   */
  const [requestedAt, setRequestedAt] = useState(Date.now())
  const [onlyOwn, setOnlyOwn] = useState(isSystemAdmin)

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

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'active',
        renderItem: ({ active }) => (
          <span className={`icon icon-14px icon-action icon-radio-${active ? 'checked2' : 'unchecked'}`} />
        ),
        width: '30px',
      },
      {
        key: Survey.sortableKeys.name,
        header: 'common.name',
        renderItem: ({ item }) => <LabelWithTooltip label={Survey.getName(Survey.getSurveyInfo(item))} />,
        width: 'minmax(8rem, 1fr)',
        sortable: true,
      },
      {
        key: Survey.sortableKeys.label,
        header: 'common.label',
        renderItem: ({ item }) => {
          const surveyInfo = Survey.getSurveyInfo(item)
          const label = Survey.getLabel(surveyInfo, lang, false) || Survey.getDefaultLabel(surveyInfo)
          return <LabelWithTooltip label={label} />
        },
        width: 'minmax(8rem, 1fr)',
        sortable: true,
      },
      {
        key: Survey.sortableKeys.ownerName,
        header: 'common.owner',
        hidden: true,
        renderItem: ({ item }) => Survey.getOwnerName(Survey.getSurveyInfo(item)),
        width: 'minmax(5rem, 12rem)',
        sortable: true,
      },
      {
        key: Survey.sortableKeys.dateCreated,
        header: 'common.dateCreated',
        renderItem: ({ item }) => DateUtils.formatDateTimeDisplay(Survey.getDateCreated(Survey.getSurveyInfo(item))),
        width: '12rem',
        sortable: true,
      },
      {
        key: Survey.sortableKeys.dateModified,
        header: 'common.dateLastModified',
        renderItem: ({ item }) => DateUtils.formatDateTimeDisplay(Survey.getDateModified(Survey.getSurveyInfo(item))),
        width: '12rem',
        sortable: true,
      },
      {
        key: Survey.sortableKeys.datePublished,
        header: 'surveysView.datePublished',
        renderItem: ({ item }) => DateUtils.formatDateTimeDisplay(Survey.getDatePublished(Survey.getSurveyInfo(item))),
        width: '12rem',
        sortable: true,
      },
      {
        key: Survey.sortableKeys.status,
        header: 'common.status',
        renderItem: ({ item }) => Survey.getStatus(Survey.getSurveyInfo(item)),
        width: '12rem',
        sortable: true,
      },
      {
        key: 'nodes',
        header: 'surveysView.nodes',
        hidden: true,
        renderItem: ({ item }) => item.nodeDefsCount,
        width: '5rem',
      },
      {
        key: 'cycles',
        header: 'surveysView.cycles',
        hidden: true,
        renderItem: ({ item }) => Survey.getCycleKeys(item).length,
        width: '5rem',
      },
      {
        key: 'languages',
        header: 'surveysView.languages',
        hidden: true,
        renderItem: ({ item }) => Survey.getLanguages(item).join('|'),
        width: '6rem',
      },
    ]
    if (!template) {
      cols.push(
        {
          key: 'records',
          header: 'surveysView.records',
          hidden: true,
          renderItem: RecordsCountIcon,
          width: '5rem',
        },
        {
          key: 'files',
          header: 'files.header',
          hidden: true,
          renderItem: TableCellFiles,
          width: '5rem',
        },
        {
          key: 'chains',
          header: 'surveysView.chains',
          hidden: true,
          renderItem: ({ item }) => item.chainsCount,
          width: '5rem',
        }
      )
    }
    return cols
  }, [lang, template])

  return (
    <Table
      cellTestIdExtractor={({ column, item }) =>
        column.key === 'name' ? Survey.getName(Survey.getSurveyInfo(item)) : null
      }
      className="surveys"
      columns={columns}
      headerLeftComponent={HeaderLeft}
      headerProps={{ onlyOwn, setOnlyOwn }}
      isRowActive={isRowActive}
      keyExtractor={({ item }) => Survey.getId(item)}
      module={module}
      moduleApiUri={moduleApiUri}
      noItemsLabelForSearchKey="surveysView.noSurveysMatchingFilter"
      onRowClick={onRowClick}
      restParams={{ lang, template, requestedAt, includeCounts: true, onlyOwn }}
      visibleColumnsSelectionEnabled
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
