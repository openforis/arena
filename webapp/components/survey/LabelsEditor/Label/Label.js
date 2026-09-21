import PropTypes from 'prop-types'
import * as A from '@core/arena'

import { Input } from '@webapp/components/form/Input'

import Badge from './Badge'

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
}) => (
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

Label.propTypes = {
  autoFocus: PropTypes.bool,
  inputFieldIdPrefix: PropTypes.string,
  inputType: PropTypes.oneOf(['input', 'textarea']),
  labels: PropTypes.object,
  lang: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  showLanguageBadge: PropTypes.bool,
  compactLanguage: PropTypes.bool,
  textTransformFunction: PropTypes.func,
}

export default Label
