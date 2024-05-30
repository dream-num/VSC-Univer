import * as vscode from 'vscode'
import { isExcelFile, readExcelFile, saveContentToFile } from './utils/file'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vs-univer.Sheets', () => {
      const panel = vscode.window.createWebviewPanel(
        'univerSheets',
        'univer-sheets',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(context.extensionPath)],
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
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('vs-univer.Docs', () => {
      const panel = vscode.window.createWebviewPanel(
        'univerDocs',
        'univer-docs',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(context.extensionPath)],
        },
      )

      panel.webview.html = getWebviewContent(context, panel, 'docs')
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('vs-univer.OpenExcel', async (uri: vscode.Uri) => {
      if (uri && uri.fsPath && isExcelFile(uri)) {
        vscode.window.showInformationMessage('Opening Excel file...')
        const pathAry = uri.fsPath.split('\\')
        const fileName = pathAry[pathAry.length - 1]
        const panel = vscode.window.createWebviewPanel(
          'univerExcel',
          fileName,
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(context.extensionPath)],
          },
        )
        const excelBuffer = await readExcelFile(uri)

        panel.webview.html = getWebviewContent(context, panel, 'sheets', excelBuffer)

        setupMessageListener(panel, fileName, uri.fsPath)

        panel.onDidDispose(
          () => {
            panel.dispose()
          },
          null,
          context.subscriptions,
        )
      }
      else {
        vscode.window.showWarningMessage('Selected file is not an Excel file')
      }
    }),
  )
}

function setupMessageListener(panel: vscode.WebviewPanel, fileName: string, fsPath?: string) {
  panel.webview.onDidReceiveMessage((message) => {
    if (message.command === 'saveAsExcel')
      saveContentToFile(message.content, fileName, fsPath)
  })
}

function getWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, type: 'sheets' | 'docs', excelBuffer?: Uint8Array) {
  const targetFile = type === 'sheets' ? 'sheets' : 'docs'
  const webview = panel.webview
  const mainCssPath = vscode.Uri.joinPath(
    context.extensionUri,
    'media',
    targetFile,
    'main.css',
  )

  const mainJsPath = vscode.Uri.joinPath(
    context.extensionUri,
    'media',
    targetFile,
    'main.js',
  )

  const wasmJsPath = vscode.Uri.joinPath(
    context.extensionUri,
    'media',
    'sheets',
    'wasm.js',
  )

  const faviconPath = vscode.Uri.joinPath(
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
