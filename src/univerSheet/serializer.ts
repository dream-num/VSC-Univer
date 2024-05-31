'use strict'
import type { ExtensionContext, WebviewPanel, WebviewPanelSerializer } from 'vscode'
import { Uri } from 'vscode'
import ExcelDocumentView from './excelDocumentView'
import LegacyDocumentView from './legacyDocumentView'

export class ExcelSerializer implements WebviewPanelSerializer {
  private _context: ExtensionContext

  constructor(context: ExtensionContext) {
    this._context = context
  }

  public async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
    ExcelDocumentView.revive(this._context, Uri.parse(state.uri), webviewPanel)
  }
}

export class LegacySerializer implements WebviewPanelSerializer {
  private _context: ExtensionContext

  constructor(context: ExtensionContext) {
    this._context = context
  }

  public async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
    LegacyDocumentView.revive(this._context, Uri.parse(state.uri), webviewPanel)
  }
}
