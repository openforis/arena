import './app.scss'

import React from 'react'
import { Link } from 'react-router-dom'

const AppView = (props) =>
  <div className="app__container">
    <Link to={'/'}>
      <span style={{fontSize: '30px', color: 'yellow', zIndex: 200}}>LOGIN</span>
    </Link>
  </div>

export default AppView