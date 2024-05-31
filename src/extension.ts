import type { ExtensionContext, WebviewPanel } from 'vscode'
import { Uri, ViewColumn, commands, window } from 'vscode'
import { saveContentToFile } from './utils/file'
import { documentViewManager } from './univerSheet/documentViewManager'
import ExcelDocumentView from './univerSheet/excelDocumentView'
import { ExcelEditorProvider } from './univerSheet/excelEditor'

export function activate(context: ExtensionContext) {
  const univerSheetCommand = commands.registerCommand('vs-univer.Sheets', () => {
    const panel = window.createWebviewPanel(
      'univerSheets',
      'univer-sheets',
      ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(context.extensionPath)],
      },
    )

    panel.webview.html = getWebviewContent(context, panel, 'sheets')

    const fileName = `${+new Date()}.xlsx`
    setupMessageListener(panel, fileName)

    panel.onDidDispose(
      () => {
        panel.dispose()
      },
      null,
      context.subscriptions,
    )
  })

  const univerDocCommand = commands.registerCommand('vs-univer.Docs', () => {
    const panel = window.createWebviewPanel(
      'univerDocs',
      'univer-docs',
      ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(context.extensionPath)],
      },
    )

    panel.webview.html = getWebviewContent(context, panel, 'docs')
  })

  const univerPreviewCommand = commands.registerCommand('vs-univer.excelPreview', async (uri: Uri) => {
    const resource = uri
    const viewColumn = getViewColumn()
    if (!(resource instanceof Uri)) {
      window.showInformationMessage('Please use the explorer context menu or editor title menu to preview Excel files.')
    }

    const excel = resource.with({ scheme: 'univer-sheet-preview' })
    let preview = documentViewManager.find(excel)
    if (preview) {
      preview.reveal()
      return
    }
    preview = await ExcelDocumentView.create(context, resource, viewColumn)
    return preview.webview
  })

  context.subscriptions.push(univerSheetCommand)
  context.subscriptions.push(univerDocCommand)
  context.subscriptions.push(univerPreviewCommand)
  context.subscriptions.push(ExcelEditorProvider.register(context))

  // TODO: add the save state feature
  // window.registerWebviewPanelSerializer('univer-excelviewer-excel', new LegacySerializer(context))
  // window.registerWebviewPanelSerializer('univer-excelviewer-excel-preview', new ExcelSerializer(context))
}

export function setupMessageListener(panel: WebviewPanel, fileName: string, fsPath?: string) {
  panel.webview.onDidReceiveMessage((message) => {
    if (message.command === 'saveAsExcel')
      saveContentToFile(message.content, fileName, fsPath)
  })
}

function getWebviewContent(context: ExtensionContext, panel: WebviewPanel, type: 'sheets' | 'docs', excelBuffer?: Uint8Array) {
  const targetFile = type === 'sheets' ? 'sheets' : 'docs'
  const webview = panel.webview
  const mainCssPath = Uri.joinPath(
    context.extensionUri,
    'media',
    targetFile,
    'main.css',
  )

  const mainJsPath = Uri.joinPath(
    context.extensionUri,
    'media',
    targetFile,
    'main.js',
  )

  const wasmJsPath = Uri.joinPath(
    context.extensionUri,
    'media',
    'sheets',
    'wasm.js',
  )

  const faviconPath = Uri.joinPath(
    context.extensionUri,
    'media',
    'favicon.svg',
  )

  const mainCssUri = webview.asWebviewUri(mainCssPath)
  const mainJsUri = webview.asWebviewUri(mainJsPath)
  const faviconUri = webview.asWebviewUri(faviconPath)
  const wasmJsUri = webview.asWebviewUri(wasmJsPath)

  const docsHtml
    = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta content="width=device-width, initial-scale=1" name="viewport" />
            <title>univer ${targetFile}</title>

            <link rel="icon" type="image/x-icon" href="${faviconUri}" />
            <link rel="stylesheet" href="${mainCssUri}" />
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
            <script src="${mainJsUri}"></script>
        </body>
    </html>
  `

  const sheetsHtml
    = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta content="width=device-width, initial-scale=1" name="viewport" />
            <title>univer ${targetFile}</title>

            <link rel="icon" type="image/x-icon" href="${faviconUri}" />
            <link rel="stylesheet" href="${mainCssUri}" />
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
            <script src="${wasmJsUri}"></script>
            <script src="${mainJsUri}"></script>
            <script>
              const vscode = acquireVsCodeApi();
              const excelBuffer = ${JSON.stringify(Array.from(excelBuffer || []))}
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

  switch (type) {
    case 'sheets':
      return sheetsHtml
    case 'docs':
      return docsHtml
  }
}

export function deactivate() { }

function getViewColumn(): ViewColumn {
  const active = window.activeTextEditor
  return active ? active.viewColumn! : ViewColumn.One
}
