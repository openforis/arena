import './notLoggedInView.scss'

import React from 'react'
import { useHistory } from 'react-router-dom'

import { useI18n } from '@webapp/commonComponents/hooks'
import { appModuleUri } from '@webapp/app/appModules'

const WordSplitter = ({ word }) => word.split('').map((letter, i) => <div key={i}>{letter}</div>)

const NotLoggedInView = props => {
  const { error, children } = props

  const i18n = useI18n()
  const history = useHistory()

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

      {error && (
        <>
          <div className="not-logged-in__form-error text-center">{i18n.t(error)}</div>
          <button className="btn not-logged-in__btn-go-to-home-page" onClick={() => history.push(appModuleUri())}>
            {i18n.t('common.goToHomePage')}
          </button>
        </>
      )}
    </>
  )
}

export default NotLoggedInView
