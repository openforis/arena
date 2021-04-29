import { template, template2 } from '../mock/survey'
import { createTemplate } from './_templateCreate'
import { selectTemplate } from './_surveyList'
import { gotoTemplateList } from './_navigation'

export default () =>
  describe('Template Create', () => {
    createTemplate(template)

    createTemplate(template2)

    // verify template
    gotoTemplateList()
    selectTemplate(template, template.label)

    // verify template2
    gotoTemplateList()
    selectTemplate(template2, template2.label)
  })
