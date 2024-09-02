import React from 'react'
import PropTypes from 'prop-types'

import { Checkbox, TextInput } from '@webapp/components/form'
import { ButtonDownload } from '@webapp/components/buttons'
import { useAuthCanExportSurveysList, useUserIsSystemAdmin } from '@webapp/store/user/hooks'

const HeaderLeft = (props) => {
  const { count, handleSearch, onlyOwn = false, search, setOnlyOwn = null } = props

  const isSystemAdmin = useUserIsSystemAdmin()
  const canExportSurveys = useAuthCanExportSurveysList()

  return (
    <>
      <div className="filter-container">
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
      </div>
      {canExportSurveys && count > 0 && <ButtonDownload href="/api/surveys/export" label="common.csvExport" />}
    </>
  )
}

HeaderLeft.propTypes = {
  count: PropTypes.number.isRequired,
  handleSearch: PropTypes.func.isRequired,
  onlyOwn: PropTypes.bool,
  search: PropTypes.string.isRequired,
  setOnlyOwn: PropTypes.func,
}

export default HeaderLeft
