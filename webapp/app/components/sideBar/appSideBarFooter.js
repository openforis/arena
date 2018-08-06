import React from 'react'

const AppSideBarFooter = ({logout, opened}) => (
  <div style={{
    display: 'grid',
    justifyItems: 'center',
    alignContent: 'space-around',
    height: '100%',
  }}>
    <a className="btn btn-s btn-of-light-xs"
       onClick={() => logout()}
       style={{
         display: 'flex',
         alignItems: 'baseline',
       }}>
            <span className={`icon icon-exit ${opened ? ' icon-left' : ''}`}
                  style={{transform: 'scaleX(-1)'}}/>
      {
        opened
          ? <span>Logout</span>
          : null
      }
    </a>

    <a className="btn btn-of-link btn-of-sidebar"
       href="http://www.openforis.org"
       target="_blank">
      {
        opened
          ? 'Open Foris' : 'OF'
      }
    </a>
  </div>
)

export default AppSideBarFooter