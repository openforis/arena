import './PasswordStrengthChecker.scss'

import classNames from 'classnames'

import { useI18nT } from '@webapp/store/system'

const checks = [
  { key: 'atLeast8CharactersLong', regExp: /^.{8,}$/ },
  { key: 'noWhiteSpaces', regExp: /^\S+$/ },
  { key: 'containsLowerCaseLetters', regExp: /^(?=.*?[a-z]).*$/ },
  { key: 'containsUpperCaseLetters', regExp: /^(?=.*?[A-Z]).*$/ },
  { key: 'containsNumbers', regExp: /^(?=.*?\d).*$/ },
]

type Props = {
  password?: string
}

/**
 * Strength bar (one segment for each passed check) and compact list of the password checks.
 *
 * @param {Props} props - The props.
 * @param {string} [props.password] - The password to check.
 * @returns {React.ReactElement} The password strength checker.
 */
export const PasswordStrengthChecker = ({ password = '' }: Props) => {
  const t = useI18nT()
  const results = checks.map(({ key, regExp }) => ({ key, passed: regExp.test(password) }))
  const passedCount = results.filter(({ passed }) => passed).length
  const title = t('guest:resetPasswordView.passwordStrengthChecksTitle')

  return (
    <div className="password-strength-checker">
      <div
        className="password-strength-checker__meter"
        role="meter"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={checks.length}
        aria-valuenow={passedCount}
      >
        {results.map(({ key }, index) => (
          <span key={key} className={classNames({ passed: index < passedCount })} />
        ))}
      </div>
      <ul className="password-strength-checker__checks" aria-label={title}>
        {results.map(({ key, passed }) => (
          <li key={key} className={classNames({ passed })}>
            <span className={classNames('icon icon-10px', passed ? 'icon-checkmark' : 'icon-radio-unchecked')} />
            {t(`guest:resetPasswordView.passwordStrengthChecks.${key}`)}
          </li>
        ))}
      </ul>
    </div>
  )
}
