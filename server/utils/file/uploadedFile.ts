// file uploaded with a multipart request (see express-fileupload, configured with temp files)
export type UploadedFile = {
  name: string
  size: number
  tempFilePath: string
  mimetype?: string
}
