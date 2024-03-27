import React from 'react'
import PropTypes from 'prop-types'

import { getLanguageISO639part2Label } from '@core/app/languages'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useI18n } from '@webapp/store/system'

const TaxaTableRowHeader = (props) => {
  const { extraPropsDefsArray, taxonomyUuid, vernacularLanguageCodes } = props

  const extraPropKeys = extraPropsDefsArray.map(ExtraPropDef.getName)

  const i18n = useI18n()

  return (
    <>
      <div>{i18n.t('#')}</div>
      <div>{i18n.t('common.code')}</div>
      <div>{i18n.t('taxonomy.edit.family')}</div>
      <div>{i18n.t('taxonomy.edit.genus')}</div>
      <div>{i18n.t('taxonomy.edit.scientificName')}</div>
      {vernacularLanguageCodes.map((lang) => {
        const header = `${getLanguageISO639part2Label(lang)} (${lang})`
        return <LabelWithTooltip key={`vernacular_name_header_${taxonomyUuid}_${lang}`} label={header} />
      })}
      {extraPropKeys.map((extraPropKey) => (
        <LabelWithTooltip key={`extra_prop_header_${extraPropKey}`} label={extraPropKey} />
      ))}
    </>
  )
}

TaxaTableRowHeader.propTypes = {
  extraPropsDefsArray: PropTypes.array.isRequired,
  taxonomyUuid: PropTypes.string.isRequired,
  vernacularLanguageCodes: PropTypes.array.isRequired,
}

export default TaxaTableRowHeader
