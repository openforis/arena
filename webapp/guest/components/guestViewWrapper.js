import './guestViewWrapper.scss'

import React from 'react'

import { useI18n } from '@webapp/commonComponents/hooks'

const WordSplitter = ({ word }) => word.split('').map((letter, i) => <div key={i}>{letter}</div>)

const GuestViewWrapper = props => {
  const { error, children } = props

  const i18n = useI18n()

  return (
    <>
      <div className="guest__bg" />

      <div className="guest__openforis">
        <div className="openforis">
          <WordSplitter word="open" />
          <div className="separator">∞</div>
          <WordSplitter word="foris" />
        </div>
        <div className="arena">
          <WordSplitter word="arena" />
        </div>
      </div>

      {error && <div className="guest-form__error text-center">{i18n.t(error)}</div>}

      <div className="guest-form">{children}</div>
    </>
  )
}

export default GuestViewWrapper
