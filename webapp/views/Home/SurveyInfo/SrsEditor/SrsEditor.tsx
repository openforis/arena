import './SrsEditor.scss'

import { useCallback } from 'react'
import axios from 'axios'

import type { ArenaValidation } from '@openforis/arena-core'

import * as Srs from '@core/geo/srs'
import InputChips from '@webapp/components/form/InputChips'
import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

type SrsEditorProps = {
  srs: any[]
  validation?: ArenaValidation
  readOnly: boolean
  setSrs: (...args: any[]) => any
}

const SrsEditor = (props: SrsEditorProps) => {
  const { srs, validation, readOnly, setSrs } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()

  const srsLookupFunction = useCallback(
    async (value) => {
      const { data } = await axios.get(`/api/survey/${surveyId}/geo/srs/find`, {
        params: { codeOrName: value },
      })
      return data.srss
    },
    [surveyId]
  )

  return (
    <InputChips
      className="srs_editor__input_chips"
      items={srsLookupFunction}
      itemKey={Srs.keys.code}
      itemLabel={Srs.getName}
      selection={srs}
      minCharactersToAutocomplete={3}
      requiredItems={1}
      validation={validation}
      onChange={setSrs}
      readOnly={readOnly}
      placeholder={i18n.t('homeView:surveyInfo.srsPlaceholder')}
    />
  )
}

export default SrsEditor
