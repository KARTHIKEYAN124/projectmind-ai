export function planRepositoryIndex(repository) {
  return [
    { name: 'clone_repository', detail: `Clone ${repository.url} using installation token for private access.` },
    { name: 'scan_repository', detail: 'Ignore node_modules, dist, build, .next, coverage, vendor, binaries, and generated files.' },
    { name: 'tree_sitter_parse', detail: 'Parse supported source files into syntax trees and symbol entities.' },
    { name: 'symbol_graph', detail: 'Extract CALLS, IMPORTS, DEPENDS_ON, TESTED_BY, and MODIFIED_BY relationships.' },
    { name: 'history_ingestion', detail: 'Analyze commits, PRs, issues, discussions, and linked docs.' },
    { name: 'embeddings', detail: 'Embed functions, classes, PR summaries, issue text, docs, and memories with pgvector.' },
    { name: 'memory_extraction', detail: 'Generate candidate architecture, decision, bug, constraint, and failed_attempt memories.' },
  ]
}

export function extractSymbols(files = []) {
  return files.flatMap((file) => {
    const text = file.text ?? ''
    const symbols = [...text.matchAll(/\b(function|class|interface|type|const|def)\s+([A-Za-z0-9_]+)/g)]
    return symbols.map((match) => ({
      name: match[2],
      kind: match[1],
      file: file.path,
      parser: 'tree-sitter-adapter-pending',
    }))
  })
}
