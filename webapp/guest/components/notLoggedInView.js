import './notLoggedInView.scss'

import React from 'react'

import { useI18n } from '@webapp/commonComponents/hooks'

const WordSplitter = ({ word }) => word.split('').map((letter, i) => <div key={i}>{letter}</div>)

const NotLoggedInView = props => {
  const { error, children } = props

  const i18n = useI18n()

  return (
    <>
      <div className="not-logged-in__bg" />

      <div className="not-logged-in__openforis">
        <div className="openforis">
          <WordSplitter word="open" />
          <div className="separator">∞</div>
          <WordSplitter word="foris" />
        </div>
        <div className="arena">
          <WordSplitter word="arena" />
        </div>
      </div>

      <form onSubmit={e => e.preventDefault()} className="not-logged-in__form">
        {children}
      </form>

      {error && <div className="not-logged-in__form-error text-center">{i18n.t(error)}</div>}
    </>
  )
}

export default NotLoggedInView
