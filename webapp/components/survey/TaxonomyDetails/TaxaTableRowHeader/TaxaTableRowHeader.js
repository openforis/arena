import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { languages } from '@core/app/languages'

import { useI18n } from '@webapp/store/system'

const TaxaTableRowHeader = (props) => {
  const { vernacularLanguageCodes, taxonomyUuid, extraPropsDefs } = props

  const i18n = useI18n()

  return (
    <>
      <div>{i18n.t('#')}</div>
      <div>{i18n.t('common.code')}</div>
      <div>{i18n.t('taxonomy.edit.family')}</div>
      <div>{i18n.t('taxonomy.edit.genus')}</div>
      <div>{i18n.t('taxonomy.edit.scientificName')}</div>
      {vernacularLanguageCodes.map((lang) => (
        <div key={`vernacular_name_header_${taxonomyUuid}_${lang}`}>{R.propOr(lang, lang)(languages)}</div>
      ))}
      {Object.keys(extraPropsDefs).map((extraPropName) => (
        <div key={`extra_prop_header_${extraPropName}`}>{extraPropName}</div>
      ))}
    </>
  )
}

TaxaTableRowHeader.propTypes = {
  taxonomyUuid: PropTypes.string.isRequired,
  vernacularLanguageCodes: PropTypes.array.isRequired,
  extraPropsDefs: PropTypes.object.isRequired,
}

export default TaxaTableRowHeader
