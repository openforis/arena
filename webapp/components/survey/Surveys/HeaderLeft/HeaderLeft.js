import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as API from '@webapp/service/api'
import { Checkbox, TextInput } from '@webapp/components/form'
import { ButtonDownload } from '@webapp/components/buttons'
import { useAuthCanExportSurveysList, useUserIsSystemAdmin } from '@webapp/store/user/hooks'
import { JobActions } from '@webapp/store/app'

const HeaderLeft = (props) => {
  const { count, handleSearch, onlyOwn = false, search, setOnlyOwn = null } = props

  const dispatch = useDispatch()
  const isSystemAdmin = useUserIsSystemAdmin()
  const canExportSurveys = useAuthCanExportSurveysList()

  const onExportClick = useCallback(async () => {
    const { job } = await API.startSurveysListExportJob()

    dispatch(
      JobActions.showJobMonitor({
        job,
        closeButton: ({ job: jobCompleted }) => {
          const { outputTempFileName: tempFileName } = jobCompleted.result
          return (
            <ButtonDownload
              href={API.getSurveyListExportedFileDownloadUrl({ tempFileName })}
              onClick={() => dispatch(JobActions.hideJobMonitor())}
              variant="contained"
            />
          )
        },
      })
    )
  }, [dispatch])

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
      {canExportSurveys && count > 0 && <ButtonDownload onClick={onExportClick} label="common.exportToExcel" />}
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
