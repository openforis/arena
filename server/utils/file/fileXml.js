import * as XmlJS from 'xml-js'

export const parseToJson = (xml, compact = true) => {
  const options = { compact, ignoreComment: true, spaces: 2 }
  return XmlJS.xml2js(xml, options)
}
