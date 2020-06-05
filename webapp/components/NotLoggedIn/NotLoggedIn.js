import './NotLoggedIn.scss'

import React from 'react'

import * as PropTypes from 'prop-types'

import { useI18n } from '@webapp/components/hooks'

const WordSplitter = ({ word }) => word.split('').map((letter, i) => <div key={String(i)}>{letter}</div>)

const NotLoggedInView = (props) => {
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

      <form onSubmit={(event) => event.preventDefault()} className="not-logged-in__form">
        {children}
      </form>

      {error && <div className="not-logged-in__form-error text-center">{i18n.t(error)}</div>}
    </>
  )
}

NotLoggedInView.propTypes = {
  error: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

export default NotLoggedInView
