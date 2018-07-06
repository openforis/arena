import './style.scss'

import React from 'react'
import * as R from 'ramda'
import { Link } from 'react-router-dom'

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

const LoginForm = () =>
  <div className="login__form login__form-box">
    <input type='text' name='username' placeholder='Your email'/>
    <input type='password' name='password' placeholder='Your password'/>
    <button type="button" className="">Login</button>
  </div>

const LoginView = () =>
  <div className="login__container height100">
    <div className="full-screen login__bg1"/>
    <div className="full-screen login__bg2"/>
    <div className="login__bg-overlay"/>

    <div className="login__grid">
      {
        cells.map(i => {
          const isLoginContainer = i === 15
          const ofLetter = ofLetters[i]
          return (
            <div key={i}
                 className={`${isLoginContainer ? 'login__form-container login__form-box' : 'login__grid-cell'}`}>
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
