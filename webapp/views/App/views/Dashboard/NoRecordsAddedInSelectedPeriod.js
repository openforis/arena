
import { useI18n } from '@webapp/store/system'

export const NoRecordsAddedInSelectedPeriod = () => {
  const i18n = useI18n()

  return <div className="no-records-added">{i18n.t('homeView:dashboard.noRecordsAddedInSelectedPeriod')}</div>
}
