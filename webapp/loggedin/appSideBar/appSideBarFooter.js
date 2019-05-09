import React from 'react'

import { I18nContext } from '../../i18n/i18nContext'

const AppSideBarFooter = ({ logout, opened }) => (
  <I18nContext.Consumer>
    {({ t }) => (
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
              ? <span>{t('logout')}</span>
              : null
          }
        </a>

        <a className="btn btn-of-link app-sidebar__btn-of"
           href="http://www.openforis.org"
           target="_blank">
          {
             opened
               ? t('open_foris') : t('open_foris_short')
           }
        </a>
      </div>
    )}
  </I18nContext.Consumer>
)

export default AppSideBarFooter