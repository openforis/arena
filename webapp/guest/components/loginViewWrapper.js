import './loginViewWrapper.scss'

import React from 'react'
import { connect } from 'react-redux'

import { useI18n } from '@webapp/commonComponents/hooks'

const LoginViewWrapper = props => {
  const { error, children } = props

  const i18n = useI18n()

  return (
    <>
      <div className="login__bg" />

      <div className="login__openforis">
        <div className="openforis">
          {'open'.split('').map((letter, i) => (
            <div key={i}>{letter}</div>
          ))}
          <div className="separator">∞</div>
          {'foris'.split('').map((letter, i) => (
            <div key={i}>{letter}</div>
          ))}
        </div>
        <div className="arena">
          {'arena'.split('').map((letter, i) => (
            <div key={i}>{letter}</div>
          ))}
        </div>
      </div>

      {error && <div className="login-form__error text-center">{i18n.t(error)}</div>}

      <div className="login-form">{children}</div>
    </>
  )
}

const mapStateToProps = state => ({})

export default connect(mapStateToProps)(LoginViewWrapper)
