import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { Input } from '@webapp/components/form/Input'

import Badge from './Badge'

const Label = ({ labels, lang, onChange, readOnly, showLanguageBadge, compactLanguage }) => (
  <div className="labels-editor__label">
    {showLanguageBadge && <Badge lang={lang} compact={compactLanguage} />}

    <Input
      value={R.propOr('', lang, labels)}
      onChange={(value) => onChange(R.ifElse(R.always(R.isEmpty(value)), R.dissoc(lang), R.assoc(lang, value))(labels))}
      readOnly={readOnly}
    />
  </div>
)

Label.propTypes = {
  labels: PropTypes.object,
  lang: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  showLanguageBadge: PropTypes.bool,
  compactLanguage: PropTypes.bool,
}

Label.defaultProps = {
  labels: {},
  lang: '',
  onChange: null,
  readOnly: false,
  showLanguageBadge: false,
  compactLanguage: false,
}

export default Label
