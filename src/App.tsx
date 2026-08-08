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

const navItems: Array<{ label: string; icon: IconType; active?: boolean }> = [
  { label: 'Dashboard', icon: Activity, active: true },
  { label: 'Ask', icon: MessageSquareText },
  { label: 'Memory', icon: BrainCircuit },
  { label: 'Code', icon: Code2 },
  { label: 'Changes', icon: GitBranch },
  { label: 'Settings', icon: Settings },
]

const sources = [
  { title: 'Introduced in PR #188', kind: 'pull_request', confidence: '96%' },
  { title: 'Issue #142 Authentication latency', kind: 'issue', confidence: '93%' },
  { title: 'docs/adr/002-redis-adoption.md', kind: 'doc', confidence: '92%' },
  { title: 'cache/redis_client.go', kind: 'code', confidence: '90%' },
]

const memories = [
  {
    date: 'May 8, 2026',
    title: 'Introduced in PR #188',
    body: 'Added Redis for caching and distributed rate limiting to resolve authentication latency.',
    kind: 'pull_request',
  },
  {
    date: 'Apr 22, 2026',
    title: 'Issue #142 Authentication latency',
    body: 'High p95 latency during login bursts identified session lookups as the bottleneck.',
    kind: 'issue',
  },
  {
    date: 'Apr 24, 2026',
    title: 'docs/adr/002-redis-adoption.md',
    body: 'Decision: adopt Redis over Memcached for cache persistence and rate limit strategy.',
    kind: 'doc',
  },
  {
    date: 'Apr 25, 2026',
    title: 'cache/redis_client.go',
    body: 'Initial Redis client with connection pool, retry logic, and circuit breaker.',
    kind: 'code',
  },
  {
    date: 'May 1, 2026',
    title: 'Changed rate limit strategy',
    body: 'Moved from in-memory to Redis-backed sliding window limits.',
    kind: 'commit',
  },
]

const ingestSteps = [
  ['Files discovered', '87,231', 'complete'],
  ['Symbols extracted', '14,481', 'complete'],
  ['Dependencies mapped', '5,224', 'complete'],
  ['Commits analyzed', '614', 'complete'],
  ['Pull requests processed', '74', 'complete'],
  ['Building engineering memory', '78%', 'active'],
  ['Generating knowledge graph', 'Queued', 'pending'],
]

const changes = [
  ['PR #228', 'Add password reset', 'Medium', '3 memories'],
  ['PR #226', 'Move rate limiter to Redis', 'High', '2 stale docs'],
  ['PR #221', 'Refactor auth middleware', 'Low', '1 decision'],
]

function App() {
  return (
    <main className="site-shell">
      <LandingHero />
      <ProductApp />
      <WorkflowSections />
      <AuthAndOnboarding />
      <FooterCta />
    </main>
  )
}

function LandingHero() {
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
          <p className="hero-lede">
            Persistent engineering memory for developers and AI agents.
          </p>
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

        <div className="answer-preview" aria-label="Example evidence backed answer">
          <PanelTitle icon={MessageSquareText} title="Ask" actionIcon={Sparkles} />
          <div className="question-input">Why do we use Redis?</div>
          <div className="preview-body">
            <AnswerBlock compact />
            <CodeGraph compact />
          </div>
        </div>
      </div>
    </section>
  )
}

function ProductApp() {
  return (
    <section className="app-frame" id="app" aria-label="ProjectMind application">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <BrainCircuit size={22} aria-hidden="true" />
          <span>ProjectMind</span>
        </div>
        <button className="repo-switch" type="button">
          <GitBranch size={16} aria-hidden="true" />
          acme/platform
          <ChevronDown size={16} aria-hidden="true" />
        </button>
        <nav className="app-nav" aria-label="Application navigation">
          {navItems.map((item) => (
            <a className={item.active ? 'active' : ''} href={`#${item.label.toLowerCase()}`} key={item.label}>
              <item.icon size={17} aria-hidden="true" />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="index-card">
          <div className="ring" aria-label="78 percent indexed">78%</div>
          <div>
            <strong>Indexing</strong>
            <span>Files indexed</span>
            <b>68,432 / 87,231</b>
            <small>Updated 2m ago</small>
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
            <h2>Dashboard</h2>
            <p>Engineering memory for acme/platform</p>
          </div>
          <div className="toolbar">
            <button type="button">
              <GitBranch size={16} aria-hidden="true" />
              main
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <button type="button">
              <Clock3 size={16} aria-hidden="true" />
              Last 7 days
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <button className="icon-button" type="button" aria-label="Refresh dashboard">
              <RefreshCw size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          <section className="panel ask-panel" id="ask">
            <PanelTitle icon={MessageSquareText} title="Ask" action="New question" />
            <div className="question-input active">Why do we use Redis?</div>
            <AnswerBlock />
          </section>

          <section className="panel memory-panel" id="memory">
            <PanelTitle icon={History} title="Recent memory" action="View all" />
            <MemoryTimeline />
          </section>

          <section className="panel graph-panel" id="code">
            <PanelTitle icon={Network} title="Code graph" action="Open in Code" subtle="impact preview" />
            <CodeGraph />
          </section>
        </div>

        <IndexingStatus />
      </div>
    </section>
  )
}

function WorkflowSections() {
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
        {[
          ['Connect', GitPullRequest],
          ['Understand', SquareCode],
          ['Remember', BrainCircuit],
          ['Answer', MessageSquareText],
        ].map(([label, Icon], index) => (
          <div className="process-step" key={label as string}>
            <Icon size={22} aria-hidden="true" />
            <span>{label as string}</span>
            {index < 3 ? <ArrowRight size={18} aria-hidden="true" /> : null}
          </div>
        ))}
      </div>

      <div className="feature-grid">
        <FeaturePanel
          icon={Layers3}
          title="Memory lifecycle"
          text="Active, questionable, superseded, deprecated, and invalid memories preserve historical truth instead of rewriting it."
        />
        <FeaturePanel
          icon={AlertTriangle}
          title="Contradiction detection"
          text="Conflicting decisions are flagged with dates, evidence, confidence, and supersession links."
        />
        <FeaturePanel
          icon={ShieldCheck}
          title="Governed truth"
          text="Important AI-generated memories can be approved, edited, rejected, and traced to source evidence."
        />
      </div>
    </section>
  )
}

function AuthAndOnboarding() {
  return (
    <section className="operations-band" id="onboarding">
      <div className="auth-panel" id="login">
        <PanelTitle icon={LockKeyhole} title="Authentication" />
        <button className="button primary full" type="button">
          <GitPullRequest size={18} aria-hidden="true" />
          Continue with GitHub
        </button>
        <button className="button secondary full" type="button">
          <UserRound size={18} aria-hidden="true" />
          Continue with Google
        </button>
        <button className="button secondary full" type="button">
          <KeyRound size={18} aria-hidden="true" />
          Continue with email
        </button>
        <p>GitHub login stays prominent for repository-first onboarding.</p>
      </div>

      <div className="onboarding-panel">
        <PanelTitle icon={Boxes} title="Repository indexing" action="Project ready" />
        <div className="ingest-list">
          {ingestSteps.map(([label, value, state]) => (
            <div className={`ingest-row ${state}`} key={label}>
              {state === 'complete' ? <Check size={16} /> : state === 'active' ? <CircleDot size={16} /> : <Clock3 size={16} />}
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="changes-panel" id="docs">
        <PanelTitle icon={BookOpen} title="Change intelligence" action="Review" />
        <div className="change-table">
          {changes.map(([pr, title, risk, memory]) => (
            <div className="change-row" key={pr}>
              <span>{pr}</span>
              <strong>{title}</strong>
              <em className={risk.toLowerCase()}>{risk}</em>
              <small>{memory}</small>
            </div>
          ))}
        </div>
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
  actionIcon: ActionIcon,
  subtle,
}: {
  icon: IconType
  title: string
  action?: string
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
      {action ? <button type="button">{action}</button> : null}
      {ActionIcon ? <ActionIcon size={17} aria-hidden="true" /> : null}
    </div>
  )
}

function AnswerBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'answer-block compact' : 'answer-block'}>
      <h4>Answer</h4>
      <p>
        We use Redis as the primary cache and distributed rate limiter to improve
        response times and protect downstream services.
      </p>
      <ul className="checks">
        <li><Check size={15} /> Introduced in PR #188 to address authentication latency.</li>
        <li><Check size={15} /> Selected over Memcached for persistence and richer data structures.</li>
        <li><Check size={15} /> Central to session storage and rate limiting strategies.</li>
      </ul>
      <div className="source-header">
        <strong>Sources ({sources.length})</strong>
        <span>Confidence 96%</span>
      </div>
      <div className="source-list">
        {sources.map((source) => (
          <div className="source-row" key={source.title}>
            <FileCode2 size={14} aria-hidden="true" />
            <span>{source.title}</span>
            <small>{source.kind}</small>
            <b>{source.confidence}</b>
          </div>
        ))}
      </div>
      {!compact ? (
        <button className="follow-up" type="button">
          <Search size={15} aria-hidden="true" />
          Ask follow-up
        </button>
      ) : null}
    </div>
  )
}

function MemoryTimeline() {
  return (
    <div className="timeline">
      {memories.map((memory) => (
        <article className="timeline-row" key={`${memory.date}-${memory.title}`}>
          <div className="timeline-pin" aria-hidden="true" />
          <time>{memory.date}</time>
          <div>
            <h4>{memory.title}</h4>
            <p>{memory.body}</p>
          </div>
          <span>{memory.kind}</span>
        </article>
      ))}
      <button className="text-button" type="button">View full timeline</button>
    </div>
  )
}

function CodeGraph({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'code-graph compact' : 'code-graph'}>
      <div className="node center">Redis Client<span>cache/redis_client.go</span></div>
      <div className="node top">Session Store<span>session/store.go</span></div>
      <div className="node right">Rate Limiter<span>rate/limiter.go</span></div>
      <div className="node bottom-right">User Service<span>service/user.go</span></div>
      <div className="node bottom">Auth Service<span>service/auth.go</span></div>
      <div className="node left">Config<span>config/cache.go</span></div>
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

function IndexingStatus() {
  const cards = [
    ['Repositories', '12', '12 active'],
    ['Files indexed', '68,432', '78%'],
    ['Code embeddings', '24.3M', '78%'],
    ['Commits processed', '18,912', 'Last 7 days'],
    ['Docs indexed', '1,284', 'Last 7 days'],
    ['Health', 'Operational', 'All systems healthy'],
  ]

  return (
    <section className="panel indexing-status">
      <PanelTitle icon={Activity} title="Indexing status" />
      <div className="status-grid">
        {cards.map(([label, value, detail], index) => (
          <div className="status-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
            {index > 0 && index < 5 ? <div className="mini-bar"><i style={{ width: index === 3 ? '62%' : '78%' }} /></div> : null}
            {index === 5 ? <div className="health-dot"><Check size={13} /> All systems operational</div> : null}
          </div>
        ))}
      </div>
    </section>
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
