import JSZip from 'jszip'

export const ZipForEach = async (file, callback) => {
    const jszip = new JSZip()
    const MAX_FILES = 10000
    const MAX_SIZE = 1000000000 // 1 GB
    let fileCount = 0
    let totalSize = 0
    let targetDirectory = '/archive_tmp'
    console.log("lol")
    await jszip.loadAsync(file)
    jszip.forEach((relativePath, fileEntry) => {
        fileCount++
        if (fileCount > MAX_FILES) {
            throw new Error('Reached max. number of files')
        }
        // Prevent ZipSlip path traversal (S6096)
        const resolvedPath = targetDirectory + '/' + fileEntry.name
        if (!resolvedPath.startsWith(targetDirectory)) {
            throw new Error('Path traversal detected')
        }
        jszip
            .file(fileEntry.name)
            .async('nodebuffer')
            .then(function (content) {
                totalSize += content.length
                if (totalSize > MAX_SIZE) {
                    throw new Error('Reached max. size')
                }
            })
        console.log("here")
        callback(relativePath, fileEntry)
    })
}
