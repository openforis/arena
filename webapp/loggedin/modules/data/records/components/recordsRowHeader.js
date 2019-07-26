import React from 'react'

import NodeDef from '../../../../../../common/survey/nodeDef'

import useI18n from '../../../../../commonComponents/useI18n'

const RecordsRowHeader = ({ nodeDefKeys, lang }) => {
  const i18n = useI18n()

  return (
    <>
      <div>#</div>
      {
        nodeDefKeys.map((k, i) => <div key={i}>{NodeDef.getLabel(k, lang)}</div>) //TODO use SurveyState.getNodeDefLabel
      }
      <div>{i18n.t('common.dateCreated')}</div>
      <div>{i18n.t('common.dateLastModified')}</div>
      <div>{i18n.t('data.records.owner')}</div>
      <div>{i18n.t('data.records.step')}</div>
    </>
  )
}

export default RecordsRowHeader
