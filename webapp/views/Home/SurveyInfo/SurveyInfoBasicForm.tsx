import * as Survey from '@core/survey/survey'
import { FormItem, Input } from '@webapp/components/form/Input'
import CycleSelector from '@webapp/components/survey/CycleSelector'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import CyclesEditor from './CyclesEditor'
import LanguagesEditor from './LanguagesEditor'
import SrsEditor from './SrsEditor'

type SurveyInfoBasicFormProps = {
  surveyInfoObject: Record<string, any>
  getFieldValidation: (...args: any[]) => any
  setFieldManualLinks: (...args: any[]) => any
  setName: (...args: any[]) => any
  setLanguages: (...args: any[]) => any
  setSrs: (...args: any[]) => any
  setLabels: (...args: any[]) => any
  setDefaultCycleKey: (...args: any[]) => any
  setDescriptions: (...args: any[]) => any
  setCycles: (...args: any[]) => any
}

export const SurveyInfoBasicForm = (props: SurveyInfoBasicFormProps) => {
  const {
    surveyInfoObject,
    getFieldValidation,
    setFieldManualLinks,
    setName,
    setLanguages,
    setSrs,
    setLabels,
    setDefaultCycleKey,
    setDescriptions,
    setCycles,
  } = props
  const { cycleKeys, cycles, defaultCycleKey, descriptions, fieldManualLinks, labels, languages, name, srs } =
    surveyInfoObject

  const readOnly = !useAuthCanEditSurvey()

  return (
    <div className="form">
      <FormItem label="common.name">
        <Input
          id={TestId.surveyInfo.surveyName}
          value={name}
          validation={getFieldValidation(Survey.infoKeys.name)}
          onChange={setName}
          readOnly={readOnly}
        />
      </FormItem>

      <LabelsEditor
        inputFieldIdPrefix={TestId.surveyInfo.surveyLabel('')}
        readOnly={readOnly}
        languages={languages}
        labels={labels}
        onChange={setLabels}
      />

      <LabelsEditor
        inputFieldIdPrefix={TestId.surveyInfo.surveyDescription('')}
        inputType="textarea"
        readOnly={readOnly}
        formLabelKey="common.description"
        languages={languages}
        labels={descriptions}
        onChange={setDescriptions}
      />

      <LabelsEditor
        inputFieldIdPrefix={TestId.surveyInfo.surveyFieldManualLink()}
        readOnly={readOnly}
        formLabelKey="homeView:surveyInfo.fieldManualLink"
        languages={languages}
        labels={fieldManualLinks}
        onChange={setFieldManualLinks}
        textTransformFunction={(link) => link.replaceAll(' ', '')}
        validation={getFieldValidation(Survey.infoKeys.fieldManualLinks)}
      />

      <LanguagesEditor
        idInput={TestId.surveyInfo.surveyLanguage}
        readOnly={readOnly}
        languages={languages}
        setLanguages={setLanguages}
      />

      <FormItem label="common.srs">
        <SrsEditor readOnly={readOnly} srs={srs} setSrs={setSrs} validation={getFieldValidation('srs')} />
      </FormItem>

      <FormItem label="common.cycle_other">
        <CyclesEditor
          cycles={cycles}
          readOnly={readOnly}
          setCycles={setCycles}
          validation={getFieldValidation(Survey.infoKeys.cycles)}
        />
      </FormItem>

      {cycleKeys.length > 1 && (
        <FormItem label="homeView:surveyInfo.cycleForArenaMobile">
          <CycleSelector
            cycleKeys={cycleKeys}
            onChange={setDefaultCycleKey}
            readOnly={readOnly}
            selectedCycle={defaultCycleKey}
          />
        </FormItem>
      )}
    </div>
  )
}
