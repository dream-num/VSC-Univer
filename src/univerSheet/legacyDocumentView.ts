'use strict'
import type { ExtensionContext, WebviewPanel } from 'vscode'
import { workspace } from 'vscode'
import type { URI } from 'vscode-uri'
import BaseDocumentView from './baseDocumentView'

export default class LegacyDocumentView extends BaseDocumentView {
  static async revive(context: ExtensionContext, uri: URI, webviewPanel: WebviewPanel): Promise<LegacyDocumentView> {
    const preview = new LegacyDocumentView(context, uri)
    const excelBuffer = await workspace.fs.readFile(uri)
    preview.scheme = 'univer-sheet-preview'
    preview.attachWebviewPanel(webviewPanel)
    preview.initialize(excelBuffer)
    return preview
  }

  refresh(): void {
  }

  getHtml(): string {
    return `
        <!DOCTYPE html>
        <html>
        <body>
            <p>This preview was created with an earlier version of Excel Viewer, and cannot be restored.</p>
            <p>Please close this tab and reopen the preview as you normally would.</p>
            <p>Alternatively, you can open a custom editor as follows:</p>
            <ul>
            <li>For Excel files, double-click the filename to open the custom editor directly.</li>
            </ul>
            <p>Excel Viewer now supports <b>Visual Studio Code for the Web</b>. To get started, go to <a href="https://vscode.dev">https://vscode.dev</a>.</p>
        </body>
        </html>`
  }

  get viewType(): string {
    return 'univer-excelviewer-excel'
  }

  get configurable(): boolean {
    return false
  }
}
