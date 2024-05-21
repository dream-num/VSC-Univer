import * as vscode from 'vscode'
import { Sheets } from './univer/sheets/main'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vs-univer.Sheets', () => {
      const panel = vscode.window.createWebviewPanel(
        'univer-sheets',
        'univer-sheets',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(context.extensionPath)],
        },
      )

      panel.webview.html = getWebviewContent(context, panel, 'sheets')
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('vs-univer.Docs', () => {
      const panel = vscode.window.createWebviewPanel(
        'univer-docs',
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
}

function getWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, type: 'sheets' | 'docs') {
  const targetFile = type === 'sheets' ? 'sheets' : 'docs'
  const webview = panel.webview
  const mainCssPath = vscode.Uri.file(
    context.asAbsolutePath(`media/${targetFile}/main.css`),
  )

  const mainJsPath = vscode.Uri.file(
    context.asAbsolutePath(`media/${targetFile}/main.js`),
  )

  const faviconPath = vscode.Uri.file(
    context.asAbsolutePath('media/favicon.svg'),
  )

  const mainCssUri = webview.asWebviewUri(mainCssPath)
  const mainJsUri = webview.asWebviewUri(mainJsPath)
  const faviconUri = webview.asWebviewUri(faviconPath)

  return `
  <!doctype html>
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta content="width=device-width, initial-scale=1" name="viewport" />
            <title>Univer Sheets</title>

            <link rel="icon" type="image/x-icon" href="${faviconUri}" />
            <link rel="stylesheet" href="${mainCssUri}" />
            <style>
                html,
                body {
                    height: 100%;
                    margin: 0;
                }
            </style>

            <script>
                new EventSource('/esbuild').addEventListener('change', () => {
                    console.info('reload--');
                    location.reload();
                });
            </script>
        </head>

        <body style="overflow: hidden">
            <div id="app" style="height: 100%"></div>

            <script src="${mainJsUri}"></script>
        </body>
    </html>
  `
}

export function deactivate() {}
