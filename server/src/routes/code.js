import express from 'express'
import { extractSymbols } from '../services/indexer.js'

export const codeRouter = express.Router()

codeRouter.post('/symbols', (request, response) => {
  response.json({
    symbols: extractSymbols(request.body?.files ?? []),
    parser: 'Tree-sitter adapter contract. Install grammars per language for production AST parsing.',
  })
})

codeRouter.get('/graph/:repositoryId', (request, response) => {
  response.json({
    repositoryId: request.params.repositoryId,
    nodes: [],
    edges: [],
    edgeTypes: ['CALLS', 'IMPORTS', 'EXTENDS', 'IMPLEMENTS', 'DEPENDS_ON', 'READS', 'WRITES', 'USES', 'DEFINED_IN', 'TESTED_BY', 'MODIFIED_BY'],
  })
})
