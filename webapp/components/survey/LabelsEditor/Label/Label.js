import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { Input } from '@webapp/components/form/Input'

import Badge from './Badge'

const Label = ({
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
      id={inputFieldIdPrefix ? `${inputFieldIdPrefix}-${lang}` : null}
      value={R.propOr('', lang, labels)}
      onChange={(value) => onChange(R.ifElse(R.always(R.isEmpty(value)), R.dissoc(lang), R.assoc(lang, value))(labels))}
      placeholder={placeholder}
      readOnly={readOnly}
      inputType={inputType}
      textTransformFunction={textTransformFunction}
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
  textTransformFunction: PropTypes.func,
}

export default Label
