/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @description this file is for univer example, because the js file is pnpm build:demo from univer example
 */

// import JSZip from 'jszip'
// import type { ILogContext, ISnapshotServerService, IUniverInstanceService, IWorkbookData, Nullable, Workbook } from '@univerjs/core'
// import { ClientSnapshotServerService, Tools, UniverInstanceService, UniverInstanceType, b64DecodeUnicode, b64EncodeUnicode, getSheetBlocksFromSnapshot, textDecoder, textEncoder, transformSnapshotToWorkbookData, transformWorkbookDataToSnapshot } from '@univerjs/core'
// import type { ISheetBlock, ISnapshot, IWorkbookMeta, IWorksheetMeta } from '@univerjs/protocol'

// export interface WorksheetMetaJson extends Omit<IWorksheetMeta, 'originalMeta'> {
//   originalMeta: string
// }

// export interface WorkbookMetaJson extends Omit<IWorkbookMeta, 'originalMeta' | 'sheets'> {
//   originalMeta: string
//   sheets: {
//     [key: string]: Partial<WorksheetMetaJson>
//   }
// }
// export interface ISnapshotJson extends Omit<ISnapshot, 'workbook'> {
//   workbook: Partial<WorkbookMetaJson>
// }

// export interface ISheetBlockData extends Omit<ISheetBlock, 'data'> {
//   data: string
// }

// export interface ISheetBlockJson {
//   [key: string]: Partial<ISheetBlockData>
// }

// export async function saveAsExcel(univerInstanceService: IUniverInstanceService) {
//   const saveWorkbookData = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)?.save()
//   if (!saveWorkbookData) { return }

//   const snapshotJSON = await transformWorkbookDataToSnapshotJson(saveWorkbookData)
//   const snapshot = JSON.stringify(snapshotJSON)
//   // @ts-expect-error
//   const excelRaw = await window.univerProExchangeExport(snapshot)
//   const excelBuffer = await transformToExcelBuffer(excelRaw)
//   return excelBuffer
// }

// /**
//  * Convert the workbook data to snapshot data
//  * @param workbookData
//  * @returns
//  */
// export async function transformWorkbookDataToSnapshotJson(workbookData: IWorkbookData): Promise<{ snapshot: ISnapshotJson, sheetBlocks: ISheetBlockJson }> {
//   const context: ILogContext = {
//     metadata: undefined,
//   }

//   const unitID = workbookData.id
//   const rev = workbookData.rev ?? 0

//   const snapshotService: ISnapshotServerService = new ClientSnapshotServerService()

//   const { snapshot } = await transformWorkbookDataToSnapshot(context, workbookData, unitID, rev, snapshotService)

//   const sheetBlocks = await getSheetBlocksFromSnapshot(snapshot, snapshotService)

//   const snapshotJson = transformSnapshotMetaToString(snapshot)

//   if (!snapshotJson) { throw new Error('Failed to transform snapshot to string') }

//   return {
//     snapshot: snapshotJson,
//     sheetBlocks: transformSheetBlockMetaToString(sheetBlocks),
//   }
// }

// function transformToExcelBuffer(data: Record<string, any>): Promise<ArrayBuffer> {
//   return new Promise((resolve, reject) => {
//     const zip = new JSZip()
//     Object.keys(data).forEach((key) => {
//       zip.file(key, data[key])
//     })

//     zip.generateAsync({ type: 'blob' }).then((content) => {
//       readFileHandler(content).then((result) => {
//         resolve(result as ArrayBuffer)
//       })
//     }).catch((error) => {
//       reject(error)
//     })
//   })
// }

// /**
//  * Convert the Uint8Array in the sheet block to a string for easy transmission to the backend
//  * @param sheetBlocks
//  * @returns
//  */
// function transformSheetBlockMetaToString(sheetBlocks: ISheetBlock[]): ISheetBlockJson {
//   const sheetBlockJson: ISheetBlockJson = {}
//   sheetBlocks.forEach((block) => {
//     sheetBlockJson[block.id] = {
//       ...block,
//       data: b64EncodeUnicode(textDecoder.decode(block.data)),
//     }
//   })
//   return sheetBlockJson
// }

// function readFileHandler(file: Blob): Promise<ArrayBuffer> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader()

//     reader.onload = () => {
//       resolve(reader.result as ArrayBuffer)
//     }

//     reader.onerror = () => {
//       reject(reader.error)
//     }

//     reader.readAsArrayBuffer(file)
//   })
// }

// /**
//  * Convert the Uint8Array in the snapshot to a string for easy transmission to the backend
//  * @param snapshot
//  * @returns
//  */
// export function transformSnapshotMetaToString(snapshot: ISnapshot): Nullable<ISnapshotJson> {
//   const workbook = snapshot.workbook
//   if (!workbook) { return null }

//   const sheets: {
//     [key: string]: Partial<WorksheetMetaJson>
//   } = {}

//   if (workbook.sheets) {
//     // Loop through sheets and convert originalMeta
//     Object.keys(workbook.sheets).forEach((sheetKey) => {
//       const sheet = workbook.sheets[sheetKey]
//       sheets[sheetKey] = {
//         ...sheet,
//         originalMeta: b64EncodeUnicode(textDecoder.decode(sheet.originalMeta)),
//       }
//     })
//   }
//   const workbookOriginalMeta = b64EncodeUnicode(textDecoder.decode(workbook.originalMeta))

//   return {
//     ...snapshot,
//     workbook: {
//       ...workbook,
//       originalMeta: workbookOriginalMeta,
//       sheets,
//     },
//   }
// }

// /**
//  * The originalMeta value in the JSON data transmitted from the backend is in string format and needs to be converted to Uint8Array first to fully comply with the ISnapshot format.
//  * @param snapshot
//  * @returns
//  */
// export function transformSnapshotMetaToBuffer(snapshot: ISnapshotJson): Nullable<ISnapshot> {
//   const workbook = snapshot.workbook
//   if (!workbook) { return null }

//   const sheets: {
//     [key: string]: IWorksheetMeta
//   } = {}

//   if (workbook.sheets) {
//     // Loop through sheets and convert originalMeta
//     Object.keys(workbook.sheets).forEach((sheetKey) => {
//       const sheet = workbook.sheets && workbook.sheets[sheetKey]

//       if (!sheet) { return }

//       // Set the converted Uint8Array to originalMeta
//       sheets[sheetKey] = {
//         ...sheet,
//         type: sheet.type || 0,
//         id: sheet.id || '',
//         name: sheet.name || '',
//         rowCount: sheet.rowCount || 0,
//         columnCount: sheet.columnCount || 0,
//         originalMeta: textEncoder.encode(b64DecodeUnicode(sheet.originalMeta || '')),
//       }
//     })
//   }

//   // Set the converted Uint8Array to originalMeta
//   const workbookOriginalMeta = textEncoder.encode(b64DecodeUnicode(workbook.originalMeta || ''))

//   return {
//     ...snapshot,
//     workbook: {
//       ...workbook,
//       unitID: workbook.unitID || '',
//       rev: workbook.rev || 0,
//       creator: workbook.creator || '',
//       name: workbook.name || '',
//       sheetOrder: workbook.sheetOrder || [],
//       resources: workbook.resources || [],
//       blockMeta: workbook.blockMeta || {},
//       originalMeta: workbookOriginalMeta,
//       sheets,
//     },
//   }
// }

// /**
//  * The data in the sheet block is in string format and needs to be converted to Uint8Array first to fully comply with the ISheetBlock format.
//  * @param sheetBlocks
//  * @returns
//  */
// export function transformSheetBlockMetaToBuffer(sheetBlocks: ISheetBlockJson): ISheetBlock[] {
//   const sheetBlockArray: ISheetBlock[] = []
//   Object.keys(sheetBlocks).forEach((blockKey) => {
//     const block = sheetBlocks[blockKey]
//     sheetBlockArray.push({
//       ...block,
//       id: block.id || '',
//       startRow: block.startRow || 0,
//       endRow: block.endRow || 0,
//       data: textEncoder.encode(b64DecodeUnicode(block.data || '')),
//     })
//   })
//   return sheetBlockArray
// }

// /**
//  * Convert snapshot data to workbook data
//  * @param snapshot
//  * @param sheetBlocks
//  * @returns
//  */
// export function transformSnapshotJsonToWorkbookData(snapshot: ISnapshotJson, sheetBlocks: ISheetBlockJson): Nullable<IWorkbookData> {
//   const snapshotData = transformSnapshotMetaToBuffer(snapshot)
//   if (!snapshotData || !sheetBlocks) { return null }

//   const blocks = transformSheetBlockMetaToBuffer(sheetBlocks)

//   return transformSnapshotToWorkbookData(snapshotData, blocks)
// }

// export function fillDefaultSheetBlock(workbookData: IWorkbookData): IWorkbookData {
//   const sheets = workbookData.sheets

//   if (sheets) {
//     Object.keys(sheets).forEach((sheetId) => {
//       const sheet = sheets[sheetId]
//       if (sheet.columnCount) { sheet.columnCount = Math.max(36, sheet.columnCount) }

//       if (sheet.rowCount) { sheet.rowCount = Math.max(99, sheet.rowCount) }
//     })
//   }
//   return workbookData
// }

// export async function getExcelBuffer2WorkbookData(univerBuffer: ArrayBuffer): Promise<IWorkbookData | undefined> {
//   console.log('has go into the excelBuffer')
//   if (univerBuffer.byteLength !== 0) {
//     // @ts-expect-error
//     const transformData = await window.univerProExchangeImport(univerBuffer)
//     const jsonData = JSON.parse(transformData)
//     const excel2WorkbookData = transformSnapshotJsonToWorkbookData(jsonData.snapshot, jsonData.sheetBlocks)

//     if (!excel2WorkbookData) { return }

//     if (!excel2WorkbookData.id) { excel2WorkbookData.id = Tools.generateRandomId(6) }

//     const workbookData = fillDefaultSheetBlock(excel2WorkbookData)

//     return workbookData

//     // const previousSheetBarCount = document.querySelectorAll('.univer-sheet-bar').length;
//     // const observer = new MutationObserver((mutationsList, observer) => {
//     //     for (const mutation of mutationsList) {
//     //         if (mutation.type === 'childList') {
//     //             const currentUniverSheetBar = document.querySelectorAll('.univer-sheet-bar').length;
//     //             if (currentUniverSheetBar !== previousSheetBarCount) {
//     //                 observer.disconnect();
//     //                 instanceService.createUnit(UniverInstanceType.UNIVER_SHEET, workbookData);
//     //                 break;
//     //             }
//     //         }
//     //     }
//     // });

//     // observer.observe(document.body, {
//     //     childList: true,
//     //     subtree: true,
//     // });
//     // const unitId = instanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)?.getUnitId();
//     // instanceService.disposeUnit(unitId || excel2WorkbookData.id);
//   }
// }
