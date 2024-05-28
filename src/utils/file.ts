import { Buffer } from 'node:buffer'
import * as fs from 'node:fs'
import path from 'node:path'
import * as vscode from 'vscode'

export async function saveContentToFile(content: ArrayBuffer, fileName: string, fsPath?: string) {
  if (fsPath) {
    try {
      await fs.writeFileSync(fsPath, Buffer.from(content))
      vscode.window.showInformationMessage(`File saved as ${fileName}`)
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to save file: ${error}`)
    }
  }
  else {
    const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath

    if (!rootPath) {
      vscode.window.showErrorMessage('No workspace folder found')
      return
    }

    const filePath = path.join(rootPath, fileName)

    try {
      await fs.writeFileSync(filePath, Buffer.from(content))
      vscode.window.showInformationMessage(`File saved as ${fileName}`)
    }
    catch (error) {
      vscode.window.showErrorMessage(`Failed to save file: ${error}`)
    }
  }
}

export function isExcelFile(uri: vscode.Uri): boolean {
  const fileExtension = path.extname(uri.fsPath)
  return fileExtension === '.xlsx' || fileExtension === '.xls' || fileExtension === 'xlsm'
}

export async function readExcelFile(uri: vscode.Uri): Promise<Uint8Array> {
  try {
    const fileData = vscode.workspace.fs.readFile(uri)
    return fileData
  }
  catch (error) {
    throw new Error(`Failed to read file: ${error}`)
  }
}
