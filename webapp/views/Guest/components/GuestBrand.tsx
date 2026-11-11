import { useI18nT } from '@webapp/store/system'

/**
 * Open Foris Arena logo and name, linking to the Arena website.
 *
 * @returns {React.ReactElement} The brand element.
 */
export const GuestBrand = () => {
  const t = useI18nT()
  return (
    <a className="guest__brand" href={t('urls.openforisArenaWebsite')} target="_blank" rel="noopener noreferrer">
      <img src="/img/of_arena_icon.png" alt="" />
      <span className="guest__brand-name">
        <small>{t('common.openForis')}</small>
        <strong>{t('common.appName')}</strong>
      </span>
    </a>
  )
}
