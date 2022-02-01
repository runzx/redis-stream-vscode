# contributes.configuration

0. `https://code.visualstudio.com/api/references/contribution-points#contributes.configuration`
1. package.json:

```json
{
  "contributes": {
    "configuration": {
      "title": "TypeScript",
      "properties": {
        "typescript.useCodeSnippetsOnMethodSuggest": {
          "type": "boolean",
          "default": false,
          "description": "Complete functions with their parameter signature."
        },
        "typescript.tsdk": {
          "type": ["string", "null"],
          "default": null,
          "description": "Specifies the folder path containing the tsserver and lib*.d.ts files to use."
        }
      }
    }
  }
}

// settings.json
{
  "typescript.tsdk":null
}
```

2. vscode.workspace.getConfiguration('myExtension') 读取配置值
3. title1️⃣️ 是用于该类别的标题
4. properties 2️⃣ 配置属性的字典
