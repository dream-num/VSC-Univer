import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('vs-univer.Univer', () => {
    vscode.window.showInformationMessage('Hello Univer!')
  })

  context.subscriptions.push(disposable)
}

export function deactivate() {}
