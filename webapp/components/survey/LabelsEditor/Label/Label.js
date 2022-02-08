import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { Input } from '@webapp/components/form/Input'

import Badge from './Badge'

const Label = ({
  inputFieldIdPrefix,
  labels,
  lang,
  onChange,
  placeholder,
  readOnly,
  showLanguageBadge,
  compactLanguage,
  inputType,
}) => (
  <div className="labels-editor__label">
    {showLanguageBadge && <Badge lang={lang} compact={compactLanguage} />}

    <Input
      id={inputFieldIdPrefix ? `${inputFieldIdPrefix}-${lang}` : null}
      value={R.propOr('', lang, labels)}
      onChange={(value) => onChange(R.ifElse(R.always(R.isEmpty(value)), R.dissoc(lang), R.assoc(lang, value))(labels))}
      placeholder={placeholder}
      readOnly={readOnly}
      inputType={inputType}
    />
  </div>
)

Label.propTypes = {
  inputFieldIdPrefix: PropTypes.string,
  inputType: PropTypes.oneOf(['input', 'textarea']),
  labels: PropTypes.object,
  lang: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  showLanguageBadge: PropTypes.bool,
  compactLanguage: PropTypes.bool,
}

Label.defaultProps = {
  inputFieldIdPrefix: null,
  inputType: 'input',
  labels: {},
  lang: '',
  onChange: null,
  placeholder: null,
  readOnly: false,
  showLanguageBadge: false,
  compactLanguage: false,
}

export default Label
