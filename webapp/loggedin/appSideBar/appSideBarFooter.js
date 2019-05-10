import React from 'react'

import AppContext from '../../app/appContext'

class AppSideBarFooter extends React.PureComponent {
  render () {
    const { logout, opened } = this.props
    const { t } = this.context.i18n

    return (
      <div className="app-sidebar__footer">
        <a className="btn btn-s btn-of-light-xs"
           onClick={() => logout()}
           style={{
             display: 'flex',
             alignItems: 'baseline',
           }}>
          <span className={`icon icon-exit ${opened ? ' icon-left' : ''}`}
                style={{ transform: 'scaleX(-1)' }}/>
          {
            opened
              ? <span>{t('sidebar.logout')}</span>
              : null
          }
        </a>

        <a className="btn btn-of-link app-sidebar__btn-of"
           href="http://www.openforis.org"
           target="_blank">
          {
            opened
              ? t('sidebar.openForis') : t('sidebar.openForisShort')
          }
        </a>
      </div>
    )
  }
}

AppSideBarFooter.contextType = AppContext

export default AppSideBarFooter