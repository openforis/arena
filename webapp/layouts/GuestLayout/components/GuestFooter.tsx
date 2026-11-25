import { useTranslation } from 'react-i18next'

import * as ProcessUtils from '@core/processUtils'

import { getUserManualUri } from '@webapp/app/appModules'
import { useI18nT } from '@webapp/store/system'

/**
 * Footer of the guest views, with links to the Arena website, user manual and support forum.
 *
 * @returns {React.ReactElement} The footer element.
 */
export const GuestFooter = () => {
  const t = useI18nT()
  const { i18n } = useTranslation()
  const version = ProcessUtils.ENV.applicationVersion

  const links = [
    { key: 'website', href: t('urls.openforisArenaWebsite'), label: t('guest:footer.website') },
    { key: 'userManual', href: getUserManualUri(i18n.language), label: t('guest:footer.userManual') },
    { key: 'supportForum', href: t('urls.supportForum'), label: t('guest:footer.supportForum') },
  ]
  return (
    <footer className="guest__footer">
      {links.map(({ key, href, label }) => (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      ))}
      {version && <span>{t('guest:footer.version', { version })}</span>}
    </footer>
  )
}
