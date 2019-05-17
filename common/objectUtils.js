const SurveyUtils = require('../common/survey/surveyUtils')

const setInPath = (pathArray = [], value = '') => obj => {
  let objCurrent = obj

  pathArray.forEach((pathPart, i) => {

    if (i === pathArray.length - 1) {
      objCurrent[pathPart] = value
    } else {
      if (!objCurrent.hasOwnProperty(pathPart)) {
        objCurrent[pathPart] = {}
      }
      objCurrent = objCurrent[pathPart]
    }

  })

  return obj
}

module.exports = {
  setInPath,

  // TODO move generic methods from SurveyUtils to ObjectUtils
  toIndexedObj: SurveyUtils.toIndexedObj,
  toUuidIndexedObj: SurveyUtils.toUuidIndexedObj

}