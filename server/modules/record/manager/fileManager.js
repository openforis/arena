import * as FileRepository from '../repository/fileRepository'

//CREATE
export const insertFile = FileRepository.insertFile

//READ
export const fetchFileByUuid = FileRepository.fetchFileByUuid
export const fetchFileByNodeUuid = FileRepository.fetchFileByNodeUuid

//DELETE
export const deleteFileByUuid = FileRepository.deleteFileByUuid
export const deleteFilesByRecordUuids = FileRepository.deleteFilesByRecordUuids
