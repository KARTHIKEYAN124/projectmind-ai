const memories = []

export function createMemory(input) {
  const memory = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: input.type ?? 'team_knowledge',
    status: input.status ?? 'active',
    title: input.title,
    content: input.content,
    confidence: input.confidence ?? 0.75,
    source: input.source ?? null,
    supersededBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  memories.unshift(memory)
  return memory
}

export function listMemories() {
  return memories
}

export function transitionMemory(id, status, supersededBy = null) {
  const memory = memories.find((item) => item.id === id)
  if (!memory) return null
  memory.status = status
  memory.supersededBy = supersededBy
  memory.updatedAt = new Date().toISOString()
  return memory
}

export function detectContradictions(candidate) {
  const candidateWords = new Set(String(candidate.content ?? '').toLowerCase().split(/\W+/).filter(Boolean))
  return memories
    .filter((memory) => memory.status === 'active')
    .filter((memory) => {
      const text = `${memory.title} ${memory.content}`.toLowerCase()
      const overlap = [...candidateWords].filter((word) => word.length > 4 && text.includes(word)).length
      return overlap > 2 && /\b(no longer|removed|migrated|instead|replaced|deprecated)\b/i.test(candidate.content ?? '')
    })
    .map((memory) => ({
      memoryId: memory.id,
      title: memory.title,
      action: 'review_for_superseded_or_invalid',
    }))
}
