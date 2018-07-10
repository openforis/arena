import './style.scss'

import React from 'react'
import * as R from 'ramda'

import LoginForm from './components/loginForm'

const noCols = 12
const noRows = 6

const noCells = noCols * noRows - 6 * 4 + 1
const cells = R.range(0, noCells)

const ofLetters = {
  1: 'O',
  2: 'P',
  3: 'E',
  4: 'N',
  6: 'F',
  7: 'O',
  8: 'R',
  9: 'I',
  10: 'S'
}

const LoginView = () =>
  <div className="login__container height100">
    {/*<div className="login__bg1"/>*/}
    {/*<div className="login__bg2"/>*/}
    {/*<div className="login__bg-overlay"/>*/}

    <div className="login__grid">
      {
        cells.map(i => {
          const isLoginContainer = i === 15
          const ofLetter = ofLetters[i]
          return (
            <div key={i}
                 className={`${isLoginContainer ? 'login__form-container' : 'login__grid-cell'}`}>
              {
                isLoginContainer
                  ? <LoginForm/>
                  : <div className={ofLetter ? 'of-letter' : ''}>{ofLetter}</div>
              }
            </div>
          )
        })

      }
    </div>

  </div>

export default LoginView
