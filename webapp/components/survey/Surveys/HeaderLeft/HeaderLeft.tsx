import { useCallback } from 'react'

import * as DateUtils from '@core/dateUtils'
import * as API from '@webapp/service/api'
import { Checkbox, TextInput } from '@webapp/components/form'
import { ButtonDownload } from '@webapp/components/buttons'
import { useAuthCanExportSurveysList, useUserIsSystemAdmin } from '@webapp/store/user/hooks'
import { JobActions } from '@webapp/store/app'
import { useAppDispatch } from '@webapp/store'

type SurveysListExportCloseButtonProps = {
  job: Record<string, any>
}

const SurveysListExportCloseButton = ({ job }: SurveysListExportCloseButtonProps) => {
  const dispatch = useAppDispatch()
  const { outputTempFileName: tempFileName } = job.result
  const date = DateUtils.nowFormatDefault()
  const fileName = `arena_surveys_${date}.xlsx`
  return (
    <ButtonDownload
      fileName={fileName}
      href={API.getSurveyListExportedFileDownloadUrl({ tempFileName })}
      onClick={() => dispatch(JobActions.hideJobMonitor())}
      variant="contained"
    />
  )
}

type HeaderLeftProps = {
  count: number
  handleSearch: (...args: any[]) => any
  onlyOwn?: boolean
  search: string
  setOnlyOwn?: (...args: any[]) => any
}

const HeaderLeft = (props: HeaderLeftProps) => {
  const { count, handleSearch, onlyOwn = false, search, setOnlyOwn = null } = props

  const dispatch = useAppDispatch()
  const isSystemAdmin = useUserIsSystemAdmin()
  const canExportSurveys = useAuthCanExportSurveysList()

  const onExportClick = useCallback(async () => {
    const { job } = await API.startSurveysListExportJob()

    dispatch(
      JobActions.showJobMonitor({
        job,
        closeButton: SurveysListExportCloseButton,
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

export default HeaderLeft
