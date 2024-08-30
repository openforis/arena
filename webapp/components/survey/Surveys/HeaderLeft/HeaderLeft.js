import React from 'react'
import PropTypes from 'prop-types'

import { Checkbox, TextInput } from '@webapp/components/form'
import { ButtonDownload } from '@webapp/components/buttons'
import { useAuthCanExportSurveysList, useUserIsSystemAdmin } from '@webapp/store/user/hooks'

const HeaderLeft = (props) => {
  const { handleSearch, onlyOwn = false, search, setOnlyOwn = null, totalCount } = props

  const isSystemAdmin = useUserIsSystemAdmin()
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
      {isSystemAdmin && setOnlyOwn && (
        <Checkbox checked={onlyOwn} label="surveysView.onlyOwn" onChange={() => setOnlyOwn(!onlyOwn)} />
      )}
      {canExportSurveys && <ButtonDownload href="/api/surveys/export" label="common.csvExport" />}
    </>
  )
}

HeaderLeft.propTypes = {
  handleSearch: PropTypes.func.isRequired,
  onlyOwn: PropTypes.bool,
  search: PropTypes.string.isRequired,
  setOnlyOwn: PropTypes.func,
  totalCount: PropTypes.number.isRequired,
}

export default HeaderLeft
