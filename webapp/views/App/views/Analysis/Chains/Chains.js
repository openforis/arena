import './Chains.scss'
import React from 'react'
import { useNavigate } from 'react-router'

import * as Chain from '@common/analysis/chain'

import { useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

import Table from '@webapp/components/Table'
import ErrorBadge from '@webapp/components/errorBadge'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import Row from './Row'
import RowHeader from './RowHeader'
import HeaderLeft from './HeaderLeft'

const ChainsView = () => {
  const navigate = useNavigate()
  const surveyCycleKey = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()

  const onRowClick = (chain) => navigate(`${appModuleUri(analysisModules.chain)}${Chain.getUuid(chain)}`)

  return (
    <Table
      className="chains"
      headerLeftComponent={HeaderLeft}
      module="processing-chains"
      onRowClick={onRowClick}
      restParams={{ surveyCycleKey }}
      columns={[
        {
          key: 'validation',
          width: '30px',
          renderItem: ({ item }) => (
            <ErrorBadge
              validation={Chain.getValidation(item)}
              className="error-badge-inverse"
              showIcon
              showLabel={false}
            />
          ),
        },
        {
          key: 'label',
          header: 'common.label',
          width: '1fr',
          renderItem: ({ item }) => (
            <div className="chain-label">
              <div>{Chain.getLabel(lang)(item)}</div>
            </div>
          ),
        },
        {
          key: Chain.keys.dateCreated,
          header: 'common.dateCreated',
          renderItem: ({ item }) => DateUtils.getRelativeDate(i18n, Chain.getDateCreated(item)),
          width: '15rem',
          sortable: true,
        },
        {
          key: Chain.keys.dateModified,
          header: 'common.dateLastModified',
          renderItem: ({ item }) => DateUtils.getRelativeDate(i18n, Chain.getDateModified(item)),
          width: '15rem',
          sortable: true,
        },
        {
          key: 'edit',
          width: '50px',
          renderItem: () => (
            <div>
              <span className="icon icon-12px icon-action icon-pencil2" />
            </div>
          ),
        },
      ]}
    />
  )
}

export default ChainsView
