import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import { useNodeDefRootKeys, useSurveyPreferredLang } from '@webapp/store/survey'
import { SortToggle } from '@webapp/components/Table'

const RowHeader = (props) => {
  const { props: tableProps } = props
  const { handleSortBy, sort } = tableProps
  const nodeDefKeys = useNodeDefRootKeys()
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  return (
    <>
      <div></div>
      <div>#</div>
      {nodeDefKeys.map((nodeDef) => (
        <div key={NodeDef.getUuid(nodeDef)}>
          <SortToggle sort={sort} handleSortBy={handleSortBy} field={NodeDef.getName(nodeDef)} />
          {NodeDef.getLabel(nodeDef, lang)}
        </div>
      ))}
      <div>
        <SortToggle sort={sort} handleSortBy={handleSortBy} field={Record.keys.dateCreated} />
        {i18n.t('common.dateCreated')}
      </div>
      <div>
        {' '}
        <SortToggle sort={sort} handleSortBy={handleSortBy} field={Record.keys.dateModified} />
        {i18n.t('common.dateLastModified')}
      </div>
      <div>{i18n.t('dataView.records.owner')}</div>
      <div>
        <SortToggle sort={sort} handleSortBy={handleSortBy} field={Record.keys.step} />
        {i18n.t('dataView.records.step')}
      </div>
      <div>{i18n.t('common.error_plural')}</div>
      <div>{i18n.t('common.warning_plural')}</div>
    </>
  )
}

RowHeader.propTypes = {
  props: PropTypes.object.isRequired,
}

export default RowHeader
