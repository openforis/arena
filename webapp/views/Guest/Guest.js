import './Guest.scss'
import React from 'react'
import { Route, Routes } from 'react-router'

import { guestModules } from '@webapp/app/appModules'
import ResetPassword from '@webapp/views/Guest/views/ResetPassword'
import ForgotPassword from '@webapp/views/Guest/views/ForgotPassword'
import AccessRequest from '@webapp/views/Guest/views/AccessRequest'
import Login from '@webapp/views/Guest/views/Login'

const WordSplitter = ({ word }) => word.split('').map((letter, i) => <div key={String(i)}>{letter}</div>)

const Guest = () => (
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

    <Routes>
      <Route path={guestModules.resetPassword.path} element={<ResetPassword />} />
      <Route path={guestModules.forgotPassword.path} element={<ForgotPassword />} />
      <Route path={guestModules.accessRequest.path} element={<AccessRequest />} />
      <Route path="*" element={<Login />} />
    </Routes>
  </>
)

export default Guest
