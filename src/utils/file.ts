import { Buffer } from 'node:buffer'
import * as fs from 'node:fs'
import path from 'node:path'
import * as vscode from 'vscode'

export async function saveContentToFile(content: ArrayBuffer, fileName: string) {
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
