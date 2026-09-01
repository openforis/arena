import { SurveyDocImages } from '@openforis/arena-core'

/**
 * Returns the first image in surveyDocImages that matches the given documentPlace and passes the isApplicable check.
 * @param {object} params - Parameters.
 * @param {Array} params.surveyDocImages - List of survey doc image file summaries.
 * @param {string} params.documentPlace - The document place to match (header or footer).
 * @param {Function} params.isApplicable - Async predicate receiving an imageFile; returns true if applicable.
 * @returns {Promise<object|null>} The first applicable image file, or null.
 */
export const findSurveyDocImageApplicable = async ({ surveyDocImages, documentPlace, isApplicable }) => {
  for (const imageFile of surveyDocImages) {
    if (SurveyDocImages.getDocumentPlace(imageFile) === documentPlace && (await isApplicable(imageFile))) {
      return imageFile
    }
  }
  return null
}
