import './Row.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import { Button, ButtonIconEditOrView } from '@webapp/components/buttons'
import ErrorBadge from '@webapp/components/errorBadge'
import WarningBadge from '@webapp/components/warningBadge'
import { useSurvey } from '@webapp/store/survey'
import { useI18n, useLang } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { State, useLocalState } from './store'

const Row = (props) => {
  const { state, Actions } = useLocalState(props)

  const survey = useSurvey()
  const lang = useLang()
  const i18n = useI18n()

  const taxonomy = State.getTaxonomy(state)
  const canSelect = State.getCanSelect(state)
  const selected = State.getSelected(state)
  const canEdit = useAuthCanEditSurvey()

  return (
    <>
      <div>{Taxonomy.getName(taxonomy)}</div>
      <div>{Taxonomy.getDescription(lang)(taxonomy)}</div>
      <div>{Taxonomy.getExtraPropsDefsArray(taxonomy).length > 0 && <span className="icon icon-checkmark" />}</div>
      <div>{Taxonomy.getTaxaCount(taxonomy)}</div>
      <div className="taxonomy-row__badge-container">
        <ErrorBadge validation={taxonomy.validation} />
      </div>
      <div className="taxonomy-row__badge-container">
        <WarningBadge show={Survey.isTaxonomyUnused(taxonomy)(survey)} label={i18n.t('itemsTable.unused')} />
      </div>

      {(canSelect || selected) && (
        <Button
          iconClassName={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px `}
          label={selected ? 'common.selected' : 'common.select'}
          onClick={() => Actions.select({ state })}
          size="small"
        />
      )}

      <ButtonIconEditOrView onClick={() => Actions.edit({ state })} canEdit={canEdit} />

      {canEdit && (
        <Button
          iconClassName="icon-bin2 icon-12px"
          label="common.delete"
          onClick={() => Actions.delete({ state })}
          size="small"
        />
      )}
    </>
  )
}

export default Row
