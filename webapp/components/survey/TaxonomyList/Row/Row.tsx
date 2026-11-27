import './Row.scss'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import { AppIcon } from '@webapp/components/AppIcon'
import { Button, ButtonIconDelete, ButtonIconEditOrView } from '@webapp/components/buttons'
import ErrorBadge from '@webapp/components/ErrorBadge'
import WarningBadge from '@webapp/components/WarningBadge'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { State, useLocalState } from './store'

const Row = (props) => {
  const { onRowOpen } = props
  const { state, Actions } = useLocalState(props)

  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const i18n = useI18n()

  const taxonomy = State.getTaxonomy(state)
  const canSelect = State.getCanSelect(state)
  const selected = State.getSelected(state)
  const canEdit = useAuthCanEditSurvey()

  return (
    <>
      <div>{Taxonomy.getName(taxonomy)}</div>
      <div>{Taxonomy.getDescription(lang)(taxonomy)}</div>
      <div>{Taxonomy.getExtraPropsDefsArray(taxonomy).length > 0 && <AppIcon name="check" />}</div>
      <div>{Taxonomy.getTaxaCount(taxonomy)}</div>
      <div className="taxonomy-row__badge-container">
        <ErrorBadge validation={taxonomy.validation} />
      </div>
      <div className="taxonomy-row__badge-container">
        <WarningBadge show={Survey.isTaxonomyUnused(taxonomy)(survey)} label={i18n.t('itemsTable.unused')} />
      </div>

      {(canSelect || selected) && (
        <Button
          iconName={selected ? 'checkboxChecked' : 'checkboxUnchecked'}
          iconSize={14}
          label={selected ? 'common.selected' : 'common.select'}
          onClick={() => Actions.select({ state })}
          size="small"
        />
      )}

      <ButtonIconEditOrView onClick={() => onRowOpen(taxonomy)} canEdit={canEdit} />

      {canEdit && <ButtonIconDelete onClick={() => Actions.delete({ state })} />}
    </>
  )
}

export default Row
