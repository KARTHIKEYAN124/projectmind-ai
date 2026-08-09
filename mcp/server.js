#!/usr/bin/env node
import readline from 'node:readline'

const tools = {
  search_code: 'Search indexed files, symbols, and code chunks.',
  search_memory: 'Search approved, questionable, superseded, deprecated, and invalid memories.',
  get_symbol: 'Return a symbol and its graph relationships.',
  get_dependencies: 'Return dependency graph edges for a file or symbol.',
  get_history: 'Return commits, PRs, and issues related to an entity.',
  get_decisions: 'Return architecture and decision memories.',
  impact_analysis: 'Estimate affected files, tests, endpoints, and risk.',
  find_similar_bug: 'Search bug and incident memories for similar failures.',
  store_memory: 'Create a candidate memory with provenance.',
  get_project_context: 'Return a compact context pack for coding agents.',
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

rl.on('line', (line) => {
  const request = JSON.parse(line)
  if (request.method === 'initialize') {
    process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { protocolVersion: '2024-11-05', serverInfo: { name: 'projectmind-mcp', version: '0.1.0' }, capabilities: { tools: {} } } })}\n`)
    return
  }
  if (request.method === 'tools/list') {
    process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { tools: Object.entries(tools).map(([name, description]) => ({ name, description, inputSchema: { type: 'object', properties: {} } })) } })}\n`)
    return
  }
  if (request.method === 'tools/call') {
    process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { content: [{ type: 'text', text: 'ProjectMind MCP tool contract is installed. Connect it to the API and database for live results.' }] } })}\n`)
    return
  }
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Method not found' } })}\n`)
})
