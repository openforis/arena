import React from 'react'
import PropTypes from 'prop-types'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'

import { FormItem, Input } from '@webapp/components/form/Input'
import { Button, ButtonDownload, ButtonMenu } from '@webapp/components/buttons'
import ErrorBadge from '@webapp/components/errorBadge'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import UploadButton from '@webapp/components/form/uploadButton'

import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { ExtraPropDefsEditor } from '../../ExtraPropDefsEditor'
import { State } from '../store'

const Header = (props) => {
  const { state, Actions } = props
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()
  const taxonomy = State.getTaxonomy(state)
  const validation = Validation.getValidation(taxonomy)
  const taxonomyUuid = Taxonomy.getUuid(taxonomy)

  return (
    <div className="taxonomy__header">
      <div>
        <ErrorBadge validation={validation} />
      </div>

      <div>
        <FormItem label={i18n.t('taxonomy.edit.taxonomyListName')}>
          <Input
            id={TestId.taxonomyDetails.taxonomyName}
            value={Taxonomy.getName(taxonomy)}
            validation={Validation.getFieldValidation(Taxonomy.keysProps.name)(validation)}
            onChange={(value) =>
              Actions.update({ key: Taxonomy.keysProps.name, value: StringUtils.normalizeName(value), state })
            }
            readOnly={!canEdit}
          />
        </FormItem>

        <LabelsEditor
          inputFieldIdPrefix={TestId.taxonomyDetails.taxonomyDescription('')}
          formLabelKey="common.description"
          labels={Taxonomy.getDescriptions(taxonomy)}
          onChange={(descriptions) =>
            Actions.update({ key: Taxonomy.keysProps.descriptions, value: descriptions, state })
          }
        />
      </div>

      <div className="button-bar">
        {canEdit && (
          <UploadButton
            inputFieldId="taxonomy-upload-input"
            label={i18n.t('common.csvImport')}
            accept=".csv"
            onChange={([file]) => Actions.upload({ state, file })}
          />
        )}
        <ButtonDownload
          href={`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/export`}
          requestParams={{ draft: canEdit }}
          label="common.csvExport"
        />
        {canEdit && (
          <ButtonMenu
            iconClassName="icon-cog icon-14px"
            popupComponent={
              <>
                <Button
                  className="btn-transparent"
                  label="extraProp.editor.title"
                  onClick={Actions.toggleEditExtraPropertiesPanel}
                />
              </>
            }
          />
        )}
      </div>

      {State.isEditingExtraPropDefs(state) && (
        <ExtraPropDefsEditor
          canAdd={false}
          extraPropDefs={Taxonomy.getExtraPropsDefsArray(taxonomy)}
          onExtraPropDefDelete={({ propName }) =>
            Actions.updateTaxonomyExtraPropDef({
              taxonomyUuid,
              propName,
              deleted: true,
            })
          }
          onExtraPropDefUpdate={({ propName, extraPropDef }) =>
            Actions.updateTaxonomyExtraPropDef({
              taxonomyUuid,
              propName,
              extraPropDef,
            })
          }
          toggleEditExtraPropsPanel={Actions.toggleEditExtraPropertiesPanel}
        />
      )}
    </div>
  )
}
Header.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default Header
