import React from 'react'
import PropTypes from 'prop-types'

import { ButtonDownload } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const HeaderLeft = (props) => {
  const { excludeResolved, setExcludeResolved } = props

  const surveyId = useSurveyId()
  const i18n = useI18n()

  return (
    <header>
      <FormItem className="exclude-resolved" label={i18n.t('homeView.collectImportReport.excludeResolvedItems')}>
        <Checkbox checked={excludeResolved} onChange={(value) => setExcludeResolved(value)} />
      </FormItem>
      <ButtonDownload href={`/api/survey/${surveyId}/collect-import/report/export/`} label="common.csvExport" />
    </header>
  )
}

HeaderLeft.propTypes = {
  excludeResolved: PropTypes.bool.isRequired,
  setExcludeResolved: PropTypes.func.isRequired,
}

export default HeaderLeft
