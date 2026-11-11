import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as XForm from '../model/xform'

/**
 * Reads the uploaded XForm XML file and parses it into the job context: `xform` (the parsed model),
 * `itextTranslations`, `languages` (with the resolved default language first), and `defaultLanguage`.
 */
export default class OdkFormReaderJob extends Job {
  static readonly type = 'OdkFormReaderJob'

  constructor(params?: any) {
    super(OdkFormReaderJob.type, params)
  }

  async execute() {
    const filePath = this.getContextProp('filePath')
    const xmlContent = await FileUtils.readFile(filePath)
    const xform = XForm.parseXForm(xmlContent)

    const { translations, defaultLang: defaultLanguage } = XForm.getItextTranslations(xform)
    const languagesFromItext = Array.from(new Set(Object.values(translations).flatMap((byLang) => Object.keys(byLang))))
    const languages = [defaultLanguage, ...languagesFromItext.filter((lang) => lang !== defaultLanguage)]

    this.setContext({ xform, itextTranslations: translations, languages, defaultLanguage })
  }
}
