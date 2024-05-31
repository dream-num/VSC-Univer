'use strict'
import type { Disposable, ExtensionContext, Memento, ViewColumn, Webview, WebviewPanel } from 'vscode'
import { window, workspace } from 'vscode'
import type { URI } from 'vscode-uri'
import { Utils } from 'vscode-uri'
import { saveContentToFile } from '../utils/file'
import { documentViewManager } from './documentViewManager'

export default abstract class BaseDocumentView {
  private _uri: URI
  private _previewUri!: URI
  private _scriptUri: URI
  private _storage: Memento
  private _panel!: WebviewPanel
  private _customEditor: boolean = true
  protected _disposed: boolean = false
  protected _disposables: Disposable[] = []

  constructor(context: ExtensionContext, uri: URI) {
    this._uri = uri
    this._scriptUri = Utils.joinPath(context.extensionUri, 'media')
    this._storage = context.workspaceState
    documentViewManager.add(this)
  }

  protected initWebviewPanel(viewColumn: ViewColumn): BaseDocumentView {
    const title = `Preview '${Utils.basename(this._uri)}'`
    const panel = window.createWebviewPanel(this.viewType, title, viewColumn, {
      enableScripts: true,
      enableCommandUris: true,
      enableFindWidget: true,
      retainContextWhenHidden: true,
    })
    return this.attachWebviewPanel(panel)
  }

  protected attachWebviewPanel(webviewPanel: WebviewPanel): BaseDocumentView {
    this._customEditor = false
    this._panel = webviewPanel
    this._previewUri = webviewPanel.webview.asWebviewUri(this._uri)
    this._scriptUri = webviewPanel.webview.asWebviewUri(this._scriptUri)
    this._panel.onDidDispose(() => {
      this.dispose()
    }, this, this._disposables)
    return this
  }

  public initialize(excelBuffer: Uint8Array) {
    this.webview.onDidReceiveMessage((e) => {
      if (e.save) {
        this.state = e.state
      }
      else if (e.refresh) {
        this.refresh()
      }
      else if (e.error) {
        window.showErrorMessage(e.error)
      }
      else {
        if (e.command === 'saveAsExcel') {
          saveContentToFile(e.content, Utils.basename(this._uri), this._uri.fsPath)
        }
      }
    }, this, this._disposables)

    workspace.onDidChangeTextDocument((e) => {
      if (!this._disposed && e.document.uri.toString() === this.uri.toString()) {
        this.refresh()
      }
    }, this, this._disposables)

    this.webview.html = this.getHtml(excelBuffer)
  }

  public dispose() {
    documentViewManager.remove(this)
    this._disposed = true
    while (this._disposables.length) {
      const item = this._disposables.pop()
      if (item) {
        item.dispose()
      }
    }
  }

  public configure(excelBuffer: Uint8Array) {
    if (this.configurable) {
      this.webview.html = this.getHtml(excelBuffer)
      this.refresh()
    }
  }

  public reload(excelBuffer: Uint8Array) {
    this.webview.html = this.getHtml(excelBuffer)
  }

  public reveal() {
    this._panel.reveal()
  }

  get hasCustomEditor(): boolean {
    return this._customEditor
  }

  get visible(): boolean {
    return this._panel.visible
  }

  get webview(): Webview {
    return this._panel.webview
  }

  get panel(): WebviewPanel {
    return this._panel
  }

  set panel(value: WebviewPanel) {
    this._previewUri = value.webview.asWebviewUri(this._uri)
    this._scriptUri = value.webview.asWebviewUri(this._scriptUri)
    this._panel = value
    value.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    }
    this._panel.onDidDispose(() => {
      this.dispose()
    }, this, this._disposables)
  }

  get scheme() {
    return this._previewUri.scheme
  }

  set scheme(value: string) {
    this._previewUri = this._uri.with({
      scheme: value,
    })
  }

  get uri(): URI {
    return this._uri
  }

  get previewUri(): URI {
    return this._previewUri
  }

  get scriptUri(): URI {
    return this._scriptUri
  }

  get state(): any {
    const key = this.previewUri.toString()
    return this._storage.get(key, null)
  }

  set state(value: any) {
    const key = this.previewUri.toString()
    this._storage.update(key, value)
  }

  public clearState(excelBuffer: Uint8Array) {
    this.state = null
    this.reload(excelBuffer)
    this.refresh()
  }

  abstract get viewType(): string
  abstract getHtml(excelBuffer: Uint8Array): string
  abstract refresh(): void
  abstract get configurable(): boolean
}
