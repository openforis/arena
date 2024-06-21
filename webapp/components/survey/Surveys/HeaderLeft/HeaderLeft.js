import React from 'react'
import PropTypes from 'prop-types'

import { TextInput } from '@webapp/components/form'
import { ButtonDownload } from '@webapp/components/buttons'
import { useAuthCanExportSurveysList } from '@webapp/store/user/hooks'

const HeaderLeft = (props) => {
  const { handleSearch, search, totalCount } = props

  const canExportSurveys = useAuthCanExportSurveysList()

  if (!totalCount) return null

  return (
    <>
      <TextInput
        className="surveys__header-left__input-search"
        defaultValue={search}
        onChange={(val) => {
          handleSearch(val)
        }}
        placeholder="surveysView.filterPlaceholder"
      />
      {canExportSurveys && <ButtonDownload href="/api/surveys/export" label="common.csvExport" />}
    </>
  )
}

HeaderLeft.propTypes = {
  handleSearch: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  totalCount: PropTypes.number.isRequired,
}

export default HeaderLeft
