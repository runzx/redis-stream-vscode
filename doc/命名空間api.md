# 命名空間 api

1. Variable
   1. 當前 colorTheme、window、textEditor、terminal 的狀態與當前活躍(active)中的(termainal、textEditor)物件

```js
const terminal = vscode.window.activeTerminal
terminal?.sendText('git branch')
```

2. Event

```js
// 监听方法
let terminal = vscode.window.activeTerminal

vscode.window.onDidChangeActiveTerminal(activeTerminal => {
  terminal = activeTerminal
})
```

3. Function
   1. createXXX: createWebview、createStatusBarItem、createQuickPick、createInputBox、createOutputChannel、createTerminal、createTreeView
   2. showXXXMessage: showErrorMessage、showInformationMessage、showInputBox、showQuickPick、showSaveDialog、showTextDocument、showWarningMessage、showWorkspaceFolderPick、withProgress
      1. showXXX 的方法則會回傳 Thenable 讓我們處理用戶點擊、輸入的非同步行為，
      2. 並取得用戶輸入、點擊結果
      3. Thenable 的用法同 Promise

```js
// 提示信息 弹窗
const input = vscode.window.createInputBox()

input.prompt = 'Enter your message'

input.title = 'message title'

input.value = 'default value'

input.onDidChangeValue(value => {
  vscode.window.showInformationMessage(`changed value: ${value}`)
})

input.onDidAccept(value => {
  input.hide()
})

input.show()

// 显示信息
let disposable = vscode.commands.registerCommand('extenionId.commandName', async () => {
  const inputValue = await vscode.window.showInputBox({
    value: 'defaultValue'
  })
  vscode.window.showInformationMessage(`Enter value: ${inputValue}`)
})
```
