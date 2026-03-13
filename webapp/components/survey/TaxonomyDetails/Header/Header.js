import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { FileFormats } from '@core/fileFormats'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'

import { FormItem, Input } from '@webapp/components/form/Input'
import { ButtonDownload, ButtonMenu, ButtonMenuExport } from '@webapp/components/buttons'
import ErrorBadge from '@webapp/components/errorBadge'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import UploadButton from '@webapp/components/form/uploadButton'
import { useNotifyWarning } from '@webapp/components/hooks'

import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { ExtraPropDefsEditorPanel } from '../../ExtraPropDefsEditor'
import { State } from '../store'

const templateFileFormats = [FileFormats.csv, FileFormats.xlsx]
const templateTypes = {
  generic: 'generic',
  specific: 'specific',
}

const Header = (props) => {
  const { state, Actions } = props
  const notifyWarn = useNotifyWarning()
  const surveyId = useSurveyId()
  const canEdit = useAuthCanEditSurvey()
  const taxonomy = State.getTaxonomy(state)
  const validation = Validation.getValidation(taxonomy)
  const taxonomyUuid = Taxonomy.getUuid(taxonomy)

  const onExtraPropsClick = useCallback(() => {
    if (Taxonomy.getExtraPropKeys(taxonomy).length === 0) {
      notifyWarn({ key: 'taxonomy.edit.extraPropsNotDefined' })
    } else {
      Actions.toggleEditExtraPropertiesPanel()
    }
  }, [Actions, notifyWarn, taxonomy])

  return (
    <div className="taxonomy__header">
      <div>
        <ErrorBadge validation={validation} />
      </div>

      <div className="row">
        <FormItem label="taxonomy.edit.taxonomyListName">
          <Input
            autoFocus
            id={TestId.taxonomyDetails.taxonomyName}
            value={Taxonomy.getName(taxonomy)}
            validation={Validation.getFieldValidation(Taxonomy.keysProps.name)(validation)}
            onChange={(value) =>
              Actions.update({ key: Taxonomy.keysProps.name, value: StringUtils.normalizeName(value), state })
            }
            readOnly={!canEdit}
          />
        </FormItem>
        {canEdit && (
          <>
            <UploadButton
              accept=".csv,.xlsx"
              inputFieldId="taxonomy-upload-input"
              label="common.import"
              onChange={([file]) => Actions.upload({ state, file })}
              title="common.importFromExcelOrCSVFile"
            />
            <ButtonMenu
              className="date-import-template-menu-btn"
              label="dataImportView.templateForImport"
              iconClassName="icon-download2 icon-14px"
              items={Object.values(templateTypes).flatMap((templateType) =>
                templateFileFormats.map((fileFormat) => ({
                  key: `taxonomy-import-template-${fileFormat}`,
                  content: (
                    <ButtonDownload
                      href={`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/import-template/`}
                      requestParams={{ draft: canEdit, fileFormat, templateType }}
                      label={`dataImportView.templateFor_${templateType}DataImport_${fileFormat}`}
                      variant="text"
                    />
                  ),
                }))
              )}
              variant="outlined"
            />

            <ButtonMenu
              iconClassName="icon-cog icon-14px"
              items={[
                {
                  key: 'extra-props-edit',
                  label: 'extraProp.editor.title',
                  onClick: onExtraPropsClick,
                },
              ]}
            />
          </>
        )}
      </div>
      <div className="row">
        <LabelsEditor
          inputFieldIdPrefix={TestId.taxonomyDetails.taxonomyDescription('')}
          formLabelKey="common.description"
          labels={Taxonomy.getDescriptions(taxonomy)}
          onChange={(descriptions) =>
            Actions.update({ key: Taxonomy.keysProps.descriptions, value: descriptions, state })
          }
        />
        <ButtonMenuExport
          href={`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/export`}
          requestParams={{ draft: canEdit }}
        />
      </div>

      {State.isEditingExtraPropDefs(state) && (
        <ExtraPropDefsEditorPanel
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
