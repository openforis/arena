import './header.scss'

import React from 'react'

const Header = ({children}) => (
  <header>
    <div className="separator"/>
    {children}
  </header>
)

export default Header
