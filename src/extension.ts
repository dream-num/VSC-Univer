import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'
import * as xlsx from 'xlsx'

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

  context.subscriptions.push(
    vscode.commands.registerCommand('vs-univer.LoadExcel', async () => {
      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Open',
        filters: {
          'Excel Files': ['xlsx'],
        },
      }

      const fileUri = await vscode.window.showOpenDialog(options)
      if (fileUri && fileUri[0]) {
        try {
          const buffer = fs.readFileSync(fileUri[0].fsPath)
          const workbook = xlsx.read(buffer, { type: 'buffer' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const data = xlsx.utils.sheet_to_json(sheet, { header: 1 })

          const panel = vscode.window.createWebviewPanel(
            'univerExcel',
            'univer-excel',
            vscode.ViewColumn.One,
            {
              enableScripts: true,
              // localResourceRoots: [vscode.Uri.file(context.extensionPath)],
            },
          )

          panel.webview.html = getWebviewXlsx(data)
        }
        catch (error) {
          vscode.window.showErrorMessage('Failed to load excel file!')
        }
      }
    }),
  )
}

function setupMessageListener(panel: vscode.WebviewPanel) {
  panel.webview.onDidReceiveMessage((message) => {
    if (message.command === 'saveContent') {
      const filePath = path.join(vscode.workspace.rootPath ?? '', 'savedContent.html')
      fs.writeFile(filePath, message.content, (err) => {
        if (err)
          vscode.window.showErrorMessage('Failed to save file!')
        else
          vscode.window.showInformationMessage('File saved successfully!')
      })
    }
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

  const faviconPath = vscode.Uri.joinPath(
    context.extensionUri,
    'media',
    'favicon.svg',
  )

  const mainCssUri = webview.asWebviewUri(mainCssPath)
  const mainJsUri = webview.asWebviewUri(mainJsPath)
  const faviconUri = webview.asWebviewUri(faviconPath)

  return `
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

            <script>
            const vscode = acquireVsCodeApi();

            document.addEventListener('keydown', (event) => {
              if (event.ctrlKey && event.key === 's') {
                  event.preventDefault(); 
                  const iframeContent = document.getElementById('app').innerHTML;
                  vscode.postMessage({
                      command: 'saveContent',
                      content: iframeContent
                  });
              }
            });
        </script>
        </body>
    </html>
  `
}

function getWebviewXlsx(data: any) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="utf-8">
      <title>Excel Data</title>
  </head>
  <body>
      <pre>${JSON.stringify(data, null, 2)}</pre>
  </body>
  </html>
  `
}

export function deactivate() {}
