import { attach, fileField, to } from 'taiko'

export const fileSelect = async ({ inputFileId, fileName }) => {
  const inputFieldFile = fileField({ id: inputFileId }, { selectHiddenElements: true })
  await attach(`test/e2e/resources/${fileName}`, to(inputFieldFile))
}
