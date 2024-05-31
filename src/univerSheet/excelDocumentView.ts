'use strict'
import type { ExtensionContext, ViewColumn, WebviewPanel } from 'vscode'
import { window, workspace } from 'vscode'
import type { URI } from 'vscode-uri'
import { saveContentToFile } from '../utils/file'
import BaseDocumentView from './baseDocumentView'
import type { ExcelDocument } from './excelEditor'

export default class ExcelDocumentView extends BaseDocumentView {
  static async create(context: ExtensionContext, uri: URI, viewColumn: ViewColumn): Promise<ExcelDocumentView> {
    const excelBuffer = await workspace.fs.readFile(uri)
    const preview = new ExcelDocumentView(context, uri)
    preview.scheme = 'univer-sheet-preview'
    preview.initWebviewPanel(viewColumn)
    preview.initialize(excelBuffer)
    return preview
  }

  static async revive(context: ExtensionContext, uri: URI, webviewPanel: WebviewPanel): Promise<ExcelDocumentView> {
    const excelBuffer = await workspace.fs.readFile(uri)
    const preview = new ExcelDocumentView(context, uri)
    preview.scheme = 'univer-sheet-preview'
    preview.attachWebviewPanel(webviewPanel)
    preview.initialize(excelBuffer)
    return preview
  }

  public getOptions(): any {
    return {
      customEditor: this.hasCustomEditor,
      uri: this.uri.toString(),
      previewUri: this.previewUri.toString(),
      state: this.state,
    }
  }

  private _document!: ExcelDocument

  public enableEditing(document: ExcelDocument) {
    this._document = document
    this.webview.onDidReceiveMessage((e) => {
      if (e.changed) {
        this._document.change(e.reason)
      }
    }, this, this._disposables)
  }

  public setupMessageListener(panel: WebviewPanel, fileName: string, fsPath?: string) {
    panel.webview.onDidReceiveMessage((message) => {
      if (message.command === 'saveAsExcel') {
        window.showInformationMessage('has got the message save as Excel')
        saveContentToFile(message.content, fileName, fsPath)
      }
    })
  }

  private getPreviewFileName(uri: URI): string {
    const pathAry = uri.fsPath.split('\\')
    return pathAry[pathAry.length - 1]
  }

  refresh(): void {
    workspace.fs.readFile(this.uri).then((buffer) => {
      this.webview.postMessage({
        refresh: true,
        content: buffer,
      })
    }, (reason) => {
      window.showInformationMessage(reason)
    })
  }

  undo(): void {
    this.webview.postMessage({
      undo: true,
    })
  }

  redo(): void {
    this.webview.postMessage({
      redo: true,
    })
  }

  getHtml(excelBuffer: Uint8Array): string {
    const uint8Array = excelBuffer
    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta content="width=device-width, initial-scale=1" name="viewport" />
            <title>univer sheet</title>

            <link rel="icon" type="image/x-icon" href="" />
            <link rel="stylesheet" href="${this.scriptUri}/sheets/main.css" />
            <style>
                html,
                body {
                    height: 100%;
                    margin: 0;
                }
            </style>
        </head>

        <body style="overflow: hidden">
            <div id="app" style="height: 100%"></div>
            <script src="${this.scriptUri}/sheets/wasm.js"></script>
            <script src="${this.scriptUri}/sheets/main.js"></script>
            <script>
              const vscode = acquireVsCodeApi();
              const excelBuffer = ${JSON.stringify(Array.from(uint8Array))}
              setTimeout(async () => {
                if(excelBuffer) {
                  const arrayBuffer = new Uint8Array(excelBuffer)
                  const workbookData = await window.univerOpenExcel(arrayBuffer.buffer)
                  if(workbookData) {
                    window.univer.createUnit(2, workbookData)
                  }else {
                    window.univer.createUnit(2, { id: 'workbook-001' })
                  }
                }
              }, 200)
              

              document.addEventListener('keydown',async (event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                    event.preventDefault(); 
                    const excelBuffer = await window.univerSheetSave()
                    vscode.postMessage({
                        command: 'saveAsExcel',
                        content: excelBuffer
                    });
                }
              });
            </script>
            
        </body>
    </html>
  `
  }

  get viewType(): string {
    return 'univer-excelviewer-excel-preview'
  }

  get configurable(): boolean {
    return false
  }
}
