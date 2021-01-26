import { attach, fileField, to } from 'taiko'

export const fileSelect = async ({ inputFileId, fileName, fileRoot = 'test/e2e/resources' }) => {
  const inputFieldFile = fileField({ id: inputFileId }, { selectHiddenElements: true })
  await attach(`${fileRoot}/${fileName}`, to(inputFieldFile))
}
