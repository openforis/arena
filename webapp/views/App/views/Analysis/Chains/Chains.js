import './Chains.scss'

import React from 'react'
import { useNavigate } from 'react-router'

import * as Chain from '@common/analysis/chain'

import * as DateUtils from '@core/dateUtils'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import ErrorBadge from '@webapp/components/errorBadge'
import Table from '@webapp/components/Table'
import { useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

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
          renderItem: ({ item }) => Chain.getLabel(lang)(item),
        },
        {
          key: 'samplingDesign',
          header: 'chainView.samplingDesign',
          renderItem: ({ item }) => Chain.hasSamplingDesign(item) && <span className="icon icon-checkmark" />,
          width: '10rem',
        },
        {
          key: Chain.keys.dateCreated,
          header: 'common.dateCreated',
          renderItem: ({ item }) => DateUtils.formatDateTimeDisplay(Chain.getDateCreated(item)),
          width: '12rem',
        },
        {
          key: Chain.keys.dateModified,
          header: 'common.dateLastModified',
          renderItem: ({ item }) => DateUtils.formatDateTimeDisplay(Chain.getDateModified(item)),
          width: '12rem',
        },
        {
          key: Chain.keys.dateExecuted,
          header: 'chainView.dateExecuted',
          renderItem: ({ item }) => DateUtils.formatDateTimeDisplay(Chain.getDateExecuted(item)),
          width: '12rem',
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
