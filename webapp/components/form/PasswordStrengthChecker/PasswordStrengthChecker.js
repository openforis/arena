import './PasswordStrengthChecker.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { ExpansionPanel } from '@webapp/components'
import { useI18n } from '@webapp/store/system'

const combinedCheckRegExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d).{8,}$/

const checks = [
  { key: 'noWhiteSpaces', regExp: /^\S+$/ },
  { key: 'atLeast8CharactersLong', regExp: /^.{8,}$/ },
  { key: 'containsLowerCaseLetters', regExp: /^(?=.*?[a-z]).*$/ },
  { key: 'containsUpperCaseLetters', regExp: /^(?=.*?[A-Z]).*$/ },
  { key: 'containsNumbers', regExp: /^(?=.*?\d).*$/ },
]

export const PasswordStrengthChecker = (props) => {
  const { password } = props

  const i18n = useI18n()

  const passwordIsValid = combinedCheckRegExp.test(password)

  return (
    <ExpansionPanel
      className="password-strength-checks-panel"
      buttonLabel="resetPasswordView.passwordStrengthChecksTitle"
      open={!passwordIsValid}
    >
      <ul>
        {checks.map(({ key, regExp }) => (
          <li key={key}>
            <span className={`icon icon-${regExp.test(password) ? 'checkmark' : 'cross'}`} />
            {i18n.t(`resetPasswordView.passwordStrengthChecks.${key}`)}
          </li>
        ))}
      </ul>
    </ExpansionPanel>
  )
}

PasswordStrengthChecker.propTypes = {
  password: PropTypes.string.isRequired,
}
