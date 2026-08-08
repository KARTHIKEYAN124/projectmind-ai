import { type CSSProperties, type FormEvent, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Boxes,
  BrainCircuit,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Code2,
  FileCode2,
  GitBranch,
  GitPullRequest,
  History,
  KeyRound,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  Network,
  Play,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SquareCode,
  UserRound,
} from 'lucide-react'
import './App.css'

type IconType = typeof Activity
type MemoryState = 'pending' | 'approved' | 'rejected'

type Memory = {
  id: number
  date: string
  title: string
  body: string
  kind: string
  state: MemoryState
}

type Change = {
  pr: string
  title: string
  risk: 'Low' | 'Medium' | 'High'
  memory: string
  reviewed: boolean
}

const navItems: Array<{ label: string; icon: IconType }> = [
  { label: 'Dashboard', icon: Activity },
  { label: 'Ask', icon: MessageSquareText },
  { label: 'Memory', icon: BrainCircuit },
  { label: 'Code', icon: Code2 },
  { label: 'Changes', icon: GitBranch },
  { label: 'Settings', icon: Settings },
]

const sourceSeed = [
  { title: 'Introduced in PR #188', kind: 'pull_request', confidence: '96%', detail: 'Merged by Sarah after p95 login latency dropped from 820ms to 230ms.' },
  { title: 'Issue #142 Authentication latency', kind: 'issue', confidence: '93%', detail: 'Login bursts caused repeated PostgreSQL session lookups and queueing.' },
  { title: 'docs/adr/002-redis-adoption.md', kind: 'doc', confidence: '92%', detail: 'ADR records Redis over Memcached for persistence and rate limiting.' },
  { title: 'cache/redis_client.go', kind: 'code', confidence: '90%', detail: 'Defines connection pool, retries, timeouts, and circuit breaker behavior.' },
]

const memorySeed: Memory[] = [
  {
    id: 1,
    date: 'May 8, 2026',
    title: 'Introduced in PR #188',
    body: 'Added Redis for caching and distributed rate limiting to resolve authentication latency.',
    kind: 'pull_request',
    state: 'approved',
  },
  {
    id: 2,
    date: 'Apr 22, 2026',
    title: 'Issue #142 Authentication latency',
    body: 'High p95 latency during login bursts identified session lookups as the bottleneck.',
    kind: 'issue',
    state: 'approved',
  },
  {
    id: 3,
    date: 'Apr 24, 2026',
    title: 'docs/adr/002-redis-adoption.md',
    body: 'Decision: adopt Redis over Memcached for cache persistence and rate limit strategy.',
    kind: 'doc',
    state: 'pending',
  },
  {
    id: 4,
    date: 'Apr 25, 2026',
    title: 'cache/redis_client.go',
    body: 'Initial Redis client with connection pool, retry logic, and circuit breaker.',
    kind: 'code',
    state: 'pending',
  },
  {
    id: 5,
    date: 'May 1, 2026',
    title: 'Changed rate limit strategy',
    body: 'Moved from in-memory to Redis-backed sliding window limits.',
    kind: 'commit',
    state: 'approved',
  },
]

const ingestLabels = [
  ['Files discovered', '87,231'],
  ['Symbols extracted', '14,481'],
  ['Dependencies mapped', '5,224'],
  ['Commits analyzed', '614'],
  ['Pull requests processed', '74'],
  ['Building engineering memory', '78%'],
  ['Generating knowledge graph', 'Queued'],
]

const graphNodes = [
  { id: 'redis', label: 'Redis Client', file: 'cache/redis_client.go', className: 'center', risk: 'High', tests: 8 },
  { id: 'session', label: 'Session Store', file: 'session/store.go', className: 'top', risk: 'Medium', tests: 3 },
  { id: 'rate', label: 'Rate Limiter', file: 'rate/limiter.go', className: 'right', risk: 'High', tests: 5 },
  { id: 'user', label: 'User Service', file: 'service/user.go', className: 'bottom-right', risk: 'Medium', tests: 4 },
  { id: 'auth', label: 'Auth Service', file: 'service/auth.go', className: 'bottom', risk: 'High', tests: 8 },
  { id: 'config', label: 'Config', file: 'config/cache.go', className: 'left', risk: 'Low', tests: 1 },
]

const changeSeed: Change[] = [
  { pr: 'PR #228', title: 'Add password reset', risk: 'Medium', memory: '3 memories', reviewed: false },
  { pr: 'PR #226', title: 'Move rate limiter to Redis', risk: 'High', memory: '2 stale docs', reviewed: false },
  { pr: 'PR #221', title: 'Refactor auth middleware', risk: 'Low', memory: '1 decision', reviewed: true },
]

function App() {
  const [question, setQuestion] = useState('Why do we use Redis?')
  const [submittedQuestion, setSubmittedQuestion] = useState('Why do we use Redis?')
  const [selectedSource, setSelectedSource] = useState(0)
  const [memories, setMemories] = useState(memorySeed)
  const [memoryDraft, setMemoryDraft] = useState('')
  const [selectedNode, setSelectedNode] = useState('redis')
  const [indexProgress, setIndexProgress] = useState(5)
  const [authStatus, setAuthStatus] = useState('Not connected')
  const [changes, setChanges] = useState(changeSeed)
  const [selectedChange, setSelectedChange] = useState('PR #226')
  const [activePanel, setActivePanel] = useState('Dashboard')
  const [activityLog, setActivityLog] = useState<string[]>([
    'Repository acme/platform loaded.',
    'Evidence pack assembled for Redis question.',
  ])

  const selectedGraphNode = graphNodes.find((node) => node.id === selectedNode) ?? graphNodes[0]
  const selectedChangeRow = changes.find((change) => change.pr === selectedChange) ?? changes[0]

  const answer = useMemo(() => {
    const lower = submittedQuestion.toLowerCase()

    if (lower.includes('postgres') || lower.includes('mongo')) {
      return {
        title: 'Database decision',
        body: 'PostgreSQL is the system of record because the team needed transactional consistency, relational reporting, and simpler migration paths after an earlier MongoDB experiment was rejected.',
        checks: [
          'MongoDB session storage was rejected after concurrent update issues.',
          'PostgreSQL migration was confirmed in ADR #004 and PR #421.',
          'Current auth, billing, and reporting modules depend on relational constraints.',
        ],
      }
    }

    if (lower.includes('break') || lower.includes('change') || lower.includes('impact')) {
      return {
        title: 'Impact analysis',
        body: `${selectedGraphNode.label} has ${selectedGraphNode.risk.toLowerCase()} change risk because it touches authentication flow, rate limiting, and ${selectedGraphNode.tests} known tests.`,
        checks: [
          '4 controllers and 3 API endpoints are potentially affected.',
          `${selectedGraphNode.tests} tests should run before merging.`,
          'Review Redis adoption memory before changing cache semantics.',
        ],
      }
    }

    return {
      title: 'Answer',
      body: 'We use Redis as the primary cache and distributed rate limiter to improve response times and protect downstream services.',
      checks: [
        'Introduced in PR #188 to address authentication latency.',
        'Selected over Memcached for persistence and richer data structures.',
        'Central to session storage and rate limiting strategies.',
      ],
    }
  }, [selectedGraphNode, submittedQuestion])

  function addLog(entry: string) {
    setActivityLog((current) => [entry, ...current].slice(0, 6))
  }

  function submitQuestion(event: FormEvent) {
    event.preventDefault()
    const clean = question.trim()
    if (!clean) return
    setSubmittedQuestion(clean)
    setActivePanel('Ask')
    addLog(`Answered: ${clean}`)
  }

  function updateMemory(id: number, state: MemoryState) {
    setMemories((current) => current.map((memory) => (memory.id === id ? { ...memory, state } : memory)))
    addLog(`${state === 'approved' ? 'Approved' : 'Rejected'} memory #${id}.`)
  }

  function addMemory(event: FormEvent) {
    event.preventDefault()
    const clean = memoryDraft.trim()
    if (!clean) return
    setMemories((current) => [
      {
        id: Date.now(),
        date: 'Today',
        title: clean,
        body: 'Manual team memory awaiting approval and source attachment.',
        kind: 'team_knowledge',
        state: 'pending',
      },
      ...current,
    ])
    setMemoryDraft('')
    setActivePanel('Memory')
    addLog(`Created candidate memory: ${clean}`)
  }

  function advanceIndexing() {
    setIndexProgress((current) => {
      const next = Math.min(current + 1, ingestLabels.length)
      addLog(next === ingestLabels.length ? 'Knowledge graph is ready.' : `Indexing advanced to step ${next + 1}.`)
      return next
    })
  }

  function connect(provider: string) {
    setAuthStatus(`Connected with ${provider}`)
    addLog(`Authentication simulated with ${provider}.`)
  }

  function reviewSelectedChange() {
    setChanges((current) => current.map((change) => (
      change.pr === selectedChange ? { ...change, reviewed: true, memory: 'reviewed' } : change
    )))
    setActivePanel('Changes')
    addLog(`${selectedChange} reviewed and memory candidates queued.`)
  }

  return (
    <main className="site-shell">
      <LandingHero
        question={question}
        setQuestion={setQuestion}
        submitQuestion={submitQuestion}
        answer={answer}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
      />
      <ProductApp
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        question={question}
        setQuestion={setQuestion}
        submitQuestion={submitQuestion}
        submittedQuestion={submittedQuestion}
        answer={answer}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        memories={memories}
        updateMemory={updateMemory}
        memoryDraft={memoryDraft}
        setMemoryDraft={setMemoryDraft}
        addMemory={addMemory}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        selectedGraphNode={selectedGraphNode}
        indexProgress={indexProgress}
        advanceIndexing={advanceIndexing}
        changes={changes}
        selectedChange={selectedChange}
        setSelectedChange={setSelectedChange}
        selectedChangeRow={selectedChangeRow}
        reviewSelectedChange={reviewSelectedChange}
        activityLog={activityLog}
      />
      <WorkflowSections setActivePanel={setActivePanel} addLog={addLog} />
      <AuthAndOnboarding
        authStatus={authStatus}
        connect={connect}
        indexProgress={indexProgress}
        advanceIndexing={advanceIndexing}
        changes={changes}
        selectedChange={selectedChange}
        setSelectedChange={setSelectedChange}
        selectedChangeRow={selectedChangeRow}
        reviewSelectedChange={reviewSelectedChange}
      />
      <FooterCta />
    </main>
  )
}

function LandingHero({
  question,
  setQuestion,
  submitQuestion,
  answer,
  selectedSource,
  setSelectedSource,
  selectedNode,
  setSelectedNode,
}: {
  question: string
  setQuestion: (value: string) => void
  submitQuestion: (event: FormEvent) => void
  answer: { title: string; body: string; checks: string[] }
  selectedSource: number
  setSelectedSource: (index: number) => void
  selectedNode: string
  setSelectedNode: (id: string) => void
}) {
  return (
    <section className="hero-section" id="top">
      <header className="topbar" aria-label="ProjectMind navigation">
        <a className="brand" href="#top" aria-label="ProjectMind home">
          <BrainCircuit size={28} aria-hidden="true" />
          <span>ProjectMind</span>
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#docs">Docs</a>
          <a href="#login">Login</a>
        </nav>
        <div className="nav-actions">
          <a className="button primary" href="#onboarding">
            <GitPullRequest size={18} aria-hidden="true" />
            Connect GitHub
          </a>
          <a className="button secondary" href="#app">
            <Play size={16} aria-hidden="true" />
            Watch Demo
          </a>
        </div>
      </header>

      <div className="hero-grid">
        <div className="hero-copy">
          <h1>Your codebase remembers every decision.</h1>
          <p className="hero-lede">Persistent engineering memory for developers and AI agents.</p>
          <p className="hero-subline">Ask why, not just what.</p>
          <div className="hero-actions">
            <a className="button primary large" href="#onboarding">
              <GitPullRequest size={20} aria-hidden="true" />
              Connect GitHub
            </a>
            <a className="button secondary large" href="#app">
              <Play size={18} aria-hidden="true" />
              Watch Demo
            </a>
          </div>
          <p className="memory-line">Give your codebase a memory.</p>
        </div>

        <div className="answer-preview" aria-label="Interactive evidence backed answer">
          <PanelTitle icon={MessageSquareText} title="Ask" actionIcon={Sparkles} />
          <AskForm question={question} setQuestion={setQuestion} submitQuestion={submitQuestion} compact />
          <div className="preview-body">
            <AnswerBlock answer={answer} selectedSource={selectedSource} setSelectedSource={setSelectedSource} compact />
            <CodeGraph selectedNode={selectedNode} setSelectedNode={setSelectedNode} compact />
          </div>
        </div>
      </div>
    </section>
  )
}

function ProductApp({
  activePanel,
  setActivePanel,
  question,
  setQuestion,
  submitQuestion,
  submittedQuestion,
  answer,
  selectedSource,
  setSelectedSource,
  memories,
  updateMemory,
  memoryDraft,
  setMemoryDraft,
  addMemory,
  selectedNode,
  setSelectedNode,
  selectedGraphNode,
  indexProgress,
  advanceIndexing,
  changes,
  selectedChange,
  setSelectedChange,
  selectedChangeRow,
  reviewSelectedChange,
  activityLog,
}: {
  activePanel: string
  setActivePanel: (panel: string) => void
  question: string
  setQuestion: (value: string) => void
  submitQuestion: (event: FormEvent) => void
  submittedQuestion: string
  answer: { title: string; body: string; checks: string[] }
  selectedSource: number
  setSelectedSource: (index: number) => void
  memories: Memory[]
  updateMemory: (id: number, state: MemoryState) => void
  memoryDraft: string
  setMemoryDraft: (value: string) => void
  addMemory: (event: FormEvent) => void
  selectedNode: string
  setSelectedNode: (id: string) => void
  selectedGraphNode: typeof graphNodes[number]
  indexProgress: number
  advanceIndexing: () => void
  changes: Change[]
  selectedChange: string
  setSelectedChange: (pr: string) => void
  selectedChangeRow: Change
  reviewSelectedChange: () => void
  activityLog: string[]
}) {
  return (
    <section className="app-frame" id="app" aria-label="ProjectMind application">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <BrainCircuit size={22} aria-hidden="true" />
          <span>ProjectMind</span>
        </div>
        <button className="repo-switch" type="button" onClick={() => setActivePanel('Settings')}>
          <GitBranch size={16} aria-hidden="true" />
          acme/platform
          <ChevronDown size={16} aria-hidden="true" />
        </button>
        <nav className="app-nav" aria-label="Application navigation">
          {navItems.map((item) => (
            <button className={activePanel === item.label ? 'active' : ''} type="button" key={item.label} onClick={() => setActivePanel(item.label)}>
              <item.icon size={17} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="index-card">
          <div className="ring" style={{ '--progress': `${Math.round((indexProgress / ingestLabels.length) * 100)}%` } as CSSProperties} aria-label={`${Math.round((indexProgress / ingestLabels.length) * 100)} percent indexed`}>
            {Math.round((indexProgress / ingestLabels.length) * 100)}%
          </div>
          <div>
            <strong>Indexing</strong>
            <span>Current task</span>
            <b>{ingestLabels[Math.min(indexProgress, ingestLabels.length - 1)][0]}</b>
            <small>Click refresh to advance</small>
          </div>
        </div>
        <div className="profile">
          <div className="avatar">AM</div>
          <div>
            <strong>Alex Morgan</strong>
            <span>alex@acme.com</span>
          </div>
          <ChevronDown size={16} aria-hidden="true" />
        </div>
      </aside>

      <div className="workspace">
        <header className="workspace-header">
          <div>
            <h2>{activePanel}</h2>
            <p>Engineering memory for acme/platform</p>
          </div>
          <div className="toolbar">
            <button type="button" onClick={() => setActivePanel('Code')}>
              <GitBranch size={16} aria-hidden="true" />
              main
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setActivePanel('Changes')}>
              <Clock3 size={16} aria-hidden="true" />
              Last 7 days
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label="Refresh dashboard" onClick={advanceIndexing}>
              <RefreshCw size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          <section className="panel ask-panel" id="ask">
            <PanelTitle icon={MessageSquareText} title="Ask" action="New question" onAction={() => setQuestion('')} />
            <AskForm question={question} setQuestion={setQuestion} submitQuestion={submitQuestion} />
            <div className="submitted-question">Current question: {submittedQuestion}</div>
            <AnswerBlock answer={answer} selectedSource={selectedSource} setSelectedSource={setSelectedSource} />
          </section>

          <section className="panel memory-panel" id="memory">
            <PanelTitle icon={History} title="Recent memory" action="Add memory" onAction={() => setActivePanel('Memory')} />
            <MemoryTimeline memories={memories} updateMemory={updateMemory} memoryDraft={memoryDraft} setMemoryDraft={setMemoryDraft} addMemory={addMemory} />
          </section>

          <section className="panel graph-panel" id="code">
            <PanelTitle icon={Network} title="Code graph" action="Run impact" subtle="impact preview" onAction={() => setActivePanel('Code')} />
            <CodeGraph selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
            <ImpactSummary selectedGraphNode={selectedGraphNode} />
          </section>
        </div>

        <IndexingStatus indexProgress={indexProgress} advanceIndexing={advanceIndexing} />
        <section className="panel workbench">
          <PanelTitle icon={BookOpen} title="Task workbench" action="Review selected PR" onAction={reviewSelectedChange} />
          <ChangeTable changes={changes} selectedChange={selectedChange} setSelectedChange={setSelectedChange} />
          <div className="detail-box">
            <strong>{selectedChangeRow.pr}: {selectedChangeRow.title}</strong>
            <p>Risk: {selectedChangeRow.risk}. Review generates candidate memories, stale-doc checks, and an impact note.</p>
          </div>
          <div className="activity-log">
            {activityLog.map((entry) => <span key={entry}>{entry}</span>)}
          </div>
        </section>
      </div>
    </section>
  )
}

function WorkflowSections({ setActivePanel, addLog }: { setActivePanel: (panel: string) => void; addLog: (entry: string) => void }) {
  const steps = [
    ['Connect', GitPullRequest, 'Settings'],
    ['Understand', SquareCode, 'Code'],
    ['Remember', BrainCircuit, 'Memory'],
    ['Answer', MessageSquareText, 'Ask'],
  ] as const

  return (
    <section className="feature-strip" id="features">
      <div className="section-heading">
        <h2>From source code to institutional memory.</h2>
        <p>
          ProjectMind combines code graph traversal, git history, PRs, issues,
          architecture decisions, stored memories, and semantic retrieval before
          an answer reaches the model.
        </p>
      </div>

      <div className="process-rail">
        {steps.map(([label, Icon, panel], index) => (
          <button className="process-step" type="button" key={label} onClick={() => {
            setActivePanel(panel)
            addLog(`${label} workflow opened.`)
            document.querySelector('#app')?.scrollIntoView({ behavior: 'smooth' })
          }}>
            <Icon size={22} aria-hidden="true" />
            <span>{label}</span>
            {index < 3 ? <ArrowRight size={18} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>

      <div className="feature-grid">
        <FeaturePanel icon={Layers3} title="Memory lifecycle" text="Approve, reject, or supersede candidate memories from the dashboard." />
        <FeaturePanel icon={AlertTriangle} title="Contradiction detection" text="Select changes to surface stale docs and conflicting memory candidates." />
        <FeaturePanel icon={ShieldCheck} title="Governed truth" text="Every answer links to source evidence and confidence before it becomes project memory." />
      </div>
    </section>
  )
}

function AuthAndOnboarding({
  authStatus,
  connect,
  indexProgress,
  advanceIndexing,
  changes,
  selectedChange,
  setSelectedChange,
  selectedChangeRow,
  reviewSelectedChange,
}: {
  authStatus: string
  connect: (provider: string) => void
  indexProgress: number
  advanceIndexing: () => void
  changes: Change[]
  selectedChange: string
  setSelectedChange: (pr: string) => void
  selectedChangeRow: Change
  reviewSelectedChange: () => void
}) {
  return (
    <section className="operations-band" id="onboarding">
      <div className="auth-panel" id="login">
        <PanelTitle icon={LockKeyhole} title="Authentication" />
        <button className="button primary full" type="button" onClick={() => connect('GitHub')}>
          <GitPullRequest size={18} aria-hidden="true" />
          Continue with GitHub
        </button>
        <button className="button secondary full" type="button" onClick={() => connect('Google')}>
          <UserRound size={18} aria-hidden="true" />
          Continue with Google
        </button>
        <button className="button secondary full" type="button" onClick={() => connect('email')}>
          <KeyRound size={18} aria-hidden="true" />
          Continue with email
        </button>
        <p>Status: {authStatus}</p>
      </div>

      <div className="onboarding-panel">
        <PanelTitle icon={Boxes} title="Repository indexing" action="Run next task" onAction={advanceIndexing} />
        <IngestList indexProgress={indexProgress} />
      </div>

      <div className="changes-panel" id="docs">
        <PanelTitle icon={BookOpen} title="Change intelligence" action={selectedChangeRow.reviewed ? 'Reviewed' : 'Review'} onAction={reviewSelectedChange} />
        <ChangeTable changes={changes} selectedChange={selectedChange} setSelectedChange={setSelectedChange} />
      </div>
    </section>
  )
}

function FooterCta() {
  return (
    <footer className="footer-cta">
      <div>
        <h2>Give your codebase a memory.</h2>
        <p>Turn PRs, issues, commits, decisions, bugs, and architecture into an auditable engineering brain.</p>
      </div>
      <a className="button primary large" href="#top">
        <GitPullRequest size={20} aria-hidden="true" />
        Connect GitHub
      </a>
    </footer>
  )
}

function PanelTitle({
  icon: Icon,
  title,
  action,
  onAction,
  actionIcon: ActionIcon,
  subtle,
}: {
  icon: IconType
  title: string
  action?: string
  onAction?: () => void
  actionIcon?: IconType
  subtle?: string
}) {
  return (
    <div className="panel-title">
      <div>
        <Icon size={17} aria-hidden="true" />
        <h3>{title}</h3>
        {subtle ? <span>{subtle}</span> : null}
      </div>
      {action ? <button type="button" onClick={onAction}>{action}</button> : null}
      {ActionIcon ? <ActionIcon size={17} aria-hidden="true" /> : null}
    </div>
  )
}

function AskForm({
  question,
  setQuestion,
  submitQuestion,
  compact = false,
}: {
  question: string
  setQuestion: (value: string) => void
  submitQuestion: (event: FormEvent) => void
  compact?: boolean
}) {
  return (
    <form className={compact ? 'ask-form compact' : 'ask-form'} onSubmit={submitQuestion}>
      <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about architecture, history, bugs, or impact" />
      <button type="submit" aria-label="Ask ProjectMind">
        <Search size={15} aria-hidden="true" />
      </button>
    </form>
  )
}

function AnswerBlock({
  answer,
  selectedSource,
  setSelectedSource,
  compact = false,
}: {
  answer: { title: string; body: string; checks: string[] }
  selectedSource: number
  setSelectedSource: (index: number) => void
  compact?: boolean
}) {
  return (
    <div className={compact ? 'answer-block compact' : 'answer-block'}>
      <h4>{answer.title}</h4>
      <p>{answer.body}</p>
      <ul className="checks">
        {answer.checks.map((check) => <li key={check}><Check size={15} /> {check}</li>)}
      </ul>
      <div className="source-header">
        <strong>Sources ({sourceSeed.length})</strong>
        <span>Confidence 96%</span>
      </div>
      <div className="source-list">
        {sourceSeed.map((source, index) => (
          <button className={selectedSource === index ? 'source-row selected' : 'source-row'} type="button" key={source.title} onClick={() => setSelectedSource(index)}>
            <FileCode2 size={14} aria-hidden="true" />
            <span>{source.title}</span>
            <small>{source.kind}</small>
            <b>{source.confidence}</b>
          </button>
        ))}
      </div>
      <div className="detail-box">
        <strong>{sourceSeed[selectedSource].title}</strong>
        <p>{sourceSeed[selectedSource].detail}</p>
      </div>
    </div>
  )
}

function MemoryTimeline({
  memories,
  updateMemory,
  memoryDraft,
  setMemoryDraft,
  addMemory,
}: {
  memories: Memory[]
  updateMemory: (id: number, state: MemoryState) => void
  memoryDraft: string
  setMemoryDraft: (value: string) => void
  addMemory: (event: FormEvent) => void
}) {
  return (
    <div className="timeline">
      <form className="memory-form" onSubmit={addMemory}>
        <input value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} placeholder="Add a memory the project should remember" />
        <button type="submit">Add</button>
      </form>
      {memories.map((memory) => (
        <article className={`timeline-row ${memory.state}`} key={memory.id}>
          <div className="timeline-pin" aria-hidden="true" />
          <time>{memory.date}</time>
          <div>
            <h4>{memory.title}</h4>
            <p>{memory.body}</p>
            {memory.state === 'pending' ? (
              <div className="row-actions">
                <button type="button" onClick={() => updateMemory(memory.id, 'approved')}>Approve</button>
                <button type="button" onClick={() => updateMemory(memory.id, 'rejected')}>Reject</button>
              </div>
            ) : null}
          </div>
          <span>{memory.state}</span>
        </article>
      ))}
    </div>
  )
}

function CodeGraph({
  selectedNode,
  setSelectedNode,
  compact = false,
}: {
  selectedNode: string
  setSelectedNode: (id: string) => void
  compact?: boolean
}) {
  return (
    <div className={compact ? 'code-graph compact' : 'code-graph'}>
      {graphNodes.map((node) => (
        <button className={`node ${node.className} ${selectedNode === node.id ? 'selected' : ''}`} type="button" key={node.id} onClick={() => setSelectedNode(node.id)}>
          {node.label}<span>{node.file}</span>
        </button>
      ))}
      <svg viewBox="0 0 560 320" className="graph-lines" aria-hidden="true">
        <path d="M280 155 L280 68" />
        <path d="M334 160 L462 102" />
        <path d="M333 177 L468 224" />
        <path d="M280 195 L280 268" />
        <path d="M226 176 L99 177" />
      </svg>
      <div className="legend">
        <span><i /> Direct dependency</span>
        <span><i className="muted" /> Indirect dependency</span>
      </div>
    </div>
  )
}

function ImpactSummary({ selectedGraphNode }: { selectedGraphNode: typeof graphNodes[number] }) {
  return (
    <div className="impact-summary">
      <strong>{selectedGraphNode.label} impact</strong>
      <div>
        <span>Risk</span><b className={selectedGraphNode.risk.toLowerCase()}>{selectedGraphNode.risk}</b>
        <span>Tests</span><b>{selectedGraphNode.tests}</b>
        <span>Endpoints</span><b>3</b>
      </div>
      <p>Run auth, session, and rate-limit checks before changing {selectedGraphNode.file}.</p>
    </div>
  )
}

function IndexingStatus({ indexProgress, advanceIndexing }: { indexProgress: number; advanceIndexing: () => void }) {
  const percent = Math.round((indexProgress / ingestLabels.length) * 100)
  const cards = [
    ['Repositories', '12', '12 active'],
    ['Files indexed', indexProgress > 0 ? '87,231' : '0', `${percent}%`],
    ['Code embeddings', indexProgress > 5 ? '24.3M' : '13.1M', `${percent}%`],
    ['Commits processed', indexProgress > 3 ? '18,912' : '8,402', 'Last 7 days'],
    ['Docs indexed', indexProgress > 4 ? '1,284' : '612', 'Last 7 days'],
    ['Health', indexProgress === ingestLabels.length ? 'Ready' : 'Indexing', indexProgress === ingestLabels.length ? 'All systems healthy' : 'Worker active'],
  ]

  return (
    <section className="panel indexing-status">
      <PanelTitle icon={Activity} title="Indexing status" action="Run next task" onAction={advanceIndexing} />
      <IngestList indexProgress={indexProgress} />
      <div className="status-grid">
        {cards.map(([label, value, detail], index) => (
          <div className="status-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
            {index > 0 && index < 5 ? <div className="mini-bar"><i style={{ width: `${percent}%` }} /></div> : null}
            {index === 5 ? <div className="health-dot"><Check size={13} /> {detail}</div> : null}
          </div>
        ))}
      </div>
    </section>
  )
}

function IngestList({ indexProgress }: { indexProgress: number }) {
  return (
    <div className="ingest-list">
      {ingestLabels.map(([label, value], index) => {
        const state = index < indexProgress ? 'complete' : index === indexProgress ? 'active' : 'pending'
        return (
          <div className={`ingest-row ${state}`} key={label}>
            {state === 'complete' ? <Check size={16} /> : state === 'active' ? <CircleDot size={16} /> : <Clock3 size={16} />}
            <span>{label}</span>
            <strong>{state === 'pending' ? 'Waiting' : value}</strong>
          </div>
        )
      })}
    </div>
  )
}

function ChangeTable({
  changes,
  selectedChange,
  setSelectedChange,
}: {
  changes: Change[]
  selectedChange: string
  setSelectedChange: (pr: string) => void
}) {
  return (
    <div className="change-table">
      {changes.map((change) => (
        <button className={selectedChange === change.pr ? 'change-row selected' : 'change-row'} type="button" key={change.pr} onClick={() => setSelectedChange(change.pr)}>
          <span>{change.pr}</span>
          <strong>{change.title}</strong>
          <em className={change.risk.toLowerCase()}>{change.risk}</em>
          <small>{change.reviewed ? 'reviewed' : change.memory}</small>
        </button>
      ))}
    </div>
  )
}

function FeaturePanel({ icon: Icon, title, text }: { icon: IconType; title: string; text: string }) {
  return (
    <article className="feature-panel">
      <Icon size={22} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

export default App
