import { getLanguageLabel, languageItemsSortedByEnLabel as appLanguages } from '@core/app/languages'
import * as A from '@core/arena'
import InputChips from '@webapp/components/form/InputChips'
import { useI18n } from '@webapp/store/system'

type LanguagesEditorProps = {
  idInput?: string
  languages: any[]
  setLanguages: (...args: any[]) => any
  readOnly: boolean
}

const LanguagesEditor = (props: LanguagesEditorProps) => {
  const { idInput, languages, setLanguages, readOnly } = props

  const selection = languages.map((lang) => ({
    value: lang,
    label: getLanguageLabel(lang),
  }))

  const i18n = useI18n()

  return (
    <div className="form-item">
      <label className="form-label" htmlFor={idInput}>
        {i18n.t('languagesEditor.languages')}
      </label>

      <InputChips
        className="lanuages_editor__input_chips"
        idInput={idInput}
        items={appLanguages}
        selection={selection}
        onChange={(items) => {
          setLanguages(A.pluck('value', items))
        }}
        requiredItems={1}
        readOnly={readOnly}
      />
    </div>
  )
}

export default LanguagesEditor
