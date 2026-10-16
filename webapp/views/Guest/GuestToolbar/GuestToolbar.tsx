import './GuestToolbar.scss'

import React from 'react'

import { ThemeButtonMenu } from '@webapp/components/ThemeButtonMenu'

import { GuestLanguageButtonMenu } from './GuestLanguageButtonMenu'

/**
 * Toolbar shown in the guest views (login, forgot password, access request...) to choose theme and UI language.
 *
 * @returns {React.ReactElement} The guest toolbar.
 */
export const GuestToolbar = () => (
  <div className="guest__toolbar">
    <ThemeButtonMenu />
    <GuestLanguageButtonMenu />
  </div>
)
