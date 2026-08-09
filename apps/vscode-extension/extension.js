const vscode = require('vscode')

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('projectmind.askCurrentFile', async () => {
      const editor = vscode.window.activeTextEditor
      const file = editor?.document.uri.fsPath
      const question = await vscode.window.showInputBox({ prompt: 'Ask ProjectMind about this file' })
      if (!question) return
      vscode.window.showInformationMessage(`ProjectMind will ask about ${file ?? 'the current workspace'}: ${question}`)
    }),
    vscode.commands.registerCommand('projectmind.impactAnalysis', async () => {
      const editor = vscode.window.activeTextEditor
      vscode.window.showInformationMessage(`ProjectMind impact analysis queued for ${editor?.document.uri.fsPath ?? 'current file'}.`)
    }),
  )
}

function deactivate() {}

module.exports = { activate, deactivate }
