# Data Storage

## 工作空间（workspace）域

1. context.workspaceState 以键值对方式存储，由 VS Code 负责管理
2. context.storagePath 为一个工作空间指定一个存储路径（一个本地的目录） -- deprecated
3. context.storageUri 为一个工作空间指定一个存储路径（一个本地的目录） -- deprecated
   1. vscode.workspace.fs.readDirectory(someUri)
   2. vscode.workspace.fs.stat(anotherUri)

## 全局域

0. 卸载并重新安装后，全局存储值仍然存在
1. context.globalState (object 各插件 各自的)
2. context.globalStoragePath (string) 向具有写/读访问权限的本地目录 -- deprecated
3. context.globalStorageUri (Uri)
   1. ".../vscode-samples.vscode-memfs"
   2. vscode-memfs 是插件 名称
   3. vscode-samples 是插件 publisher 发布者名称

```js
context.storageUri.pth = "/C:/Users/runzx/AppData/Roaming/Code/User/workspaceStorage/b9ec6c53b9d25c605eab6600aad00671/vscode-samples.vscode-memfs"
context.globalStorageUri.path = "/C:/Users/runzx/AppData/Roaming/Code/User/globalStorage/vscode-samples.vscode-memfs"

// package.json
{
  "name": "vscode-memfs",
  "publisher": "vscode-samples"
}
```

### globalState

1. get(key, default)
2. update(key,val) // val undefined 删除此 key
3. keys()

### [什么时候用工作区？]

1. 有且仅有需要同时在多个项目上工作的时候，才需要创建工作区，这时候，工作区里面有多个项目文件夹的根目录(root)，即：Multi-root Workspaces
2. 工作空间(workspace)具体指后缀为`*.code-workspace`的文件

### Single-folder workspaces

1. vscode.workspace.name 文件夹时为 目录名称
   1. 没打开文件夹时为 undefined

###　 VSCode 层次关系

1. 系统默认设置（不可修改）-用户设置-工作区设置-文件夹设置
   1. 全局 - 工作环境 - 项目
2. 工作区可以不打开，即无“工作区设置”
   1. 用户设置 - 文件夹设置
