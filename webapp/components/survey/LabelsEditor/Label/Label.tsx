import * as A from '@core/arena'

import { Input } from '@webapp/components/form/Input'

import Badge from './Badge'

type LabelProps = {
  autoFocus?: boolean
  inputFieldIdPrefix?: string
  inputType?: 'input' | 'textarea'
  labels?: Record<string, any>
  lang?: string
  onChange?: (...args: any[]) => any
  placeholder?: string
  readOnly?: boolean
  showLanguageBadge?: boolean
  compactLanguage?: boolean
  textTransformFunction?: (...args: any[]) => any
}

const Label = ({
  autoFocus,
  compactLanguage = false,
  inputFieldIdPrefix,
  inputType = 'input',
  labels = {},
  lang = '',
  onChange,
  placeholder,
  readOnly = false,
  showLanguageBadge = false,
  textTransformFunction,
}: LabelProps) => (
  <div className="labels-editor__label">
    {showLanguageBadge && <Badge lang={lang} compact={compactLanguage} />}

    <Input
      autoFocus={autoFocus}
      id={inputFieldIdPrefix ? `${inputFieldIdPrefix}-${lang}` : null}
      value={A.propOr('', lang, labels)}
      onChange={(value) => onChange(A.ifElse(A.always(A.isEmpty(value)), A.dissoc(lang), A.assoc(lang, value))(labels))}
      placeholder={placeholder}
      readOnly={readOnly}
      inputType={inputType}
      textTransformFunction={textTransformFunction}
    />
  </div>
)

export default Label
