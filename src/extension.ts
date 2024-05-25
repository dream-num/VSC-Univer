import * as vscode from 'vscode'
import { saveContentToFile } from './utils/file'

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

      setupMessageListener(panel)

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

      setupMessageListener(panel)
    }),
  )
}

function setupMessageListener(panel: vscode.WebviewPanel) {
  panel.webview.onDidReceiveMessage((message) => {
    if (message.command === 'saveAsExcel')
      saveContentToFile(message.content, 'univer-sheet.xlsx')
  })
}

function getWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, type: 'sheets' | 'docs') {
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
            <script src="${mainJsUri}"></script>
            <script src="${wasmJsUri}"></script>
            <script>
            const vscode = acquireVsCodeApi();

            document.addEventListener('keydown',async (event) => {
              if (event.ctrlKey && event.key === 's') {
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

  return type === 'sheets' ? sheetsHtml : docsHtml
}

export function deactivate() {}
