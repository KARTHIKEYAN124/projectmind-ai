import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  FileCode2,
  GitPullRequest,
  History,
  KeyRound,
  LockKeyhole,
  MessageSquareText,
  Network,
  Pause,
  Play,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react'
import './App.css'

type Page = 'home' | 'features' | 'docs' | 'login' | 'demo' | 'app'
type AuthProvider = 'GitHub' | 'Google' | 'email'
type AuthMode = 'signup' | 'signin'
type WorkflowStep = 'connect' | 'index' | 'ask' | 'memory' | 'impact'

type RepoFile = {
  path: string
  text: string
  size: number
}

type Commit = {
  sha: string
  message: string
  author: string
  date: string
}

type Evidence = {
  title: string
  kind: string
  confidence: string
  detail: string
}

type RepoIndex = {
  owner: string
  repo: string
  branch: string
  files: RepoFile[]
  commits: Commit[]
  indexedAt: string
}

const demoSteps = [
  ['Connect a repository', 'Sign in, paste a GitHub repository URL, and load metadata from GitHub.'],
  ['Index code and history', 'Fetch repository files and recent commits, then create searchable evidence.'],
  ['Ask why', 'Ask questions and rank answers from files, docs, commits, and memories.'],
  ['Review memory', 'Turn useful answers into approved project memories with provenance.'],
  ['Run impact analysis', 'Select a file and see likely dependencies, risk, and tests to run.'],
] as const

const featureList = [
  ['Repository connection', 'Connect public GitHub repositories directly in the browser; OAuth launch is ready when client IDs are configured.'],
  ['Code and history indexing', 'Fetch files, README/docs, package metadata, source files, and recent commit history.'],
  ['Ask repository', 'Questions are answered from ranked repository evidence rather than a fixed demo response.'],
  ['Memory review', 'Promote useful answers into approved project memories with source citations.'],
  ['Impact analysis', 'Estimate change risk from selected files, imports, related paths, and test coverage hints.'],
  ['Separate product pages', 'Features, Docs, Login, and Watch Demo now open as distinct app pages.'],
]

const initialMemories: Evidence[] = [
  {
    title: 'Project memory requires provenance',
    kind: 'memory',
    confidence: '92%',
    detail: 'Every useful answer should point back to files, commits, docs, issues, or approved team knowledge.',
  },
]

function App() {
  const [page, setPage] = useState<Page>('home')
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
  const [authStatus, setAuthStatus] = useState('Not signed in')
  const [name, setName] = useState('Alex Morgan')
  const [email, setEmail] = useState('alex@acme.com')
  const [password, setPassword] = useState('projectmind-demo')
  const [repoUrl, setRepoUrl] = useState('https://github.com/KARTHIKEYAN124/projectmind-ai')
  const [repoIndex, setRepoIndex] = useState<RepoIndex | null>(null)
  const [connectStatus, setConnectStatus] = useState('Paste a public GitHub repository URL to begin.')
  const [isIndexing, setIsIndexing] = useState(false)
  const [question, setQuestion] = useState('What does this repository do?')
  const [answer, setAnswer] = useState('Connect and index a repository, then ask a question.')
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [memories, setMemories] = useState<Evidence[]>(initialMemories)
  const [selectedFile, setSelectedFile] = useState('')
  const [activeStep, setActiveStep] = useState<WorkflowStep>('connect')
  const [demoPlaying, setDemoPlaying] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [activityLog, setActivityLog] = useState<string[]>(['ProjectMind ready.'])

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Page
    if (['features', 'docs', 'login', 'demo', 'app'].includes(hash)) setPage(hash)
  }, [])

  useEffect(() => {
    if (!demoPlaying) return
    const timer = window.setInterval(() => setDemoStep((current) => (current + 1) % demoSteps.length), 2400)
    return () => window.clearInterval(timer)
  }, [demoPlaying])

  const stats = useMemo(() => {
    const files = repoIndex?.files.length ?? 0
    const commits = repoIndex?.commits.length ?? 0
    const symbols = repoIndex ? estimateSymbols(repoIndex.files) : 0
    const docs = repoIndex ? repoIndex.files.filter((file) => isDocFile(file.path)).length : 0
    return { files, commits, symbols, docs }
  }, [repoIndex])

  const impact = useMemo(() => {
    if (!repoIndex || !selectedFile) return null
    const file = repoIndex.files.find((item) => item.path === selectedFile)
    if (!file) return null
    return analyzeImpact(file, repoIndex.files)
  }, [repoIndex, selectedFile])

  function go(next: Page) {
    window.history.pushState(null, '', next === 'home' ? '#' : `#${next}`)
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function log(entry: string) {
    setActivityLog((current) => [entry, ...current].slice(0, 8))
  }

  function signIn(provider: AuthProvider) {
    if (provider === 'email') {
      if (!email.trim() || password.length < 8) {
        setAuthStatus('Enter an email and a password with at least 8 characters.')
        return
      }
      const account = { name, email, provider: 'email', signedInAt: new Date().toISOString() }
      localStorage.setItem('projectmind-user', JSON.stringify(account))
      setAuthStatus(`${authMode === 'signup' ? 'Signed up' : 'Signed in'} as ${email}`)
      log(`${authMode === 'signup' ? 'Created' : 'Opened'} email session for ${email}.`)
      go('app')
      return
    }

    const clientId = provider === 'GitHub'
      ? import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined
      : import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

    if (!clientId) {
      setAuthStatus(`${provider} OAuth needs ${provider === 'GitHub' ? 'VITE_GITHUB_CLIENT_ID' : 'VITE_GOOGLE_CLIENT_ID'} in .env.local.`)
      return
    }

    const state = crypto.randomUUID()
    sessionStorage.setItem(`projectmind-${provider.toLowerCase()}-state`, state)
    const redirectUri = `${window.location.origin}/auth/${provider.toLowerCase()}/callback`

    if (provider === 'GitHub') {
      const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope: 'read:user user:email repo', state })
      window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`
      return
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async function connectAndIndexRepository(event?: FormEvent) {
    event?.preventDefault()
    const parsed = parseGitHubUrl(repoUrl)
    if (!parsed) {
      setConnectStatus('Enter a valid GitHub repository URL, for example https://github.com/owner/repo.')
      return
    }

    setIsIndexing(true)
    setActiveStep('index')
    setConnectStatus(`Connecting to ${parsed.owner}/${parsed.repo}...`)
    log(`Connecting to ${parsed.owner}/${parsed.repo}.`)

    try {
      const index = await buildRepoIndex(parsed.owner, parsed.repo)
      setRepoIndex(index)
      setSelectedFile(index.files[0]?.path ?? '')
      setConnectStatus(`Indexed ${index.files.length} files and ${index.commits.length} commits from ${index.owner}/${index.repo}.`)
      setEvidence([
        { title: `${index.owner}/${index.repo}`, kind: 'repository', confidence: '100%', detail: `Default branch: ${index.branch}. Indexed at ${new Date(index.indexedAt).toLocaleString()}.` },
        { title: 'Recent commits', kind: 'history', confidence: '88%', detail: index.commits.slice(0, 3).map((commit) => commit.message).join(' | ') || 'No commits returned by GitHub API.' },
      ])
      setAnswer(`Repository indexed. Ask about architecture, files, dependencies, setup, history, risks, or why something exists in ${index.owner}/${index.repo}.`)
      log(`Indexed ${index.files.length} files and ${index.commits.length} commits.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown GitHub API error.'
      setConnectStatus(message)
      log(`Indexing failed: ${message}`)
    } finally {
      setIsIndexing(false)
    }
  }

  function askRepository(event: FormEvent) {
    event.preventDefault()
    if (!repoIndex) {
      setAnswer('Connect and index a repository first. I need real files and commits before I can answer from repo evidence.')
      setEvidence([])
      setActiveStep('connect')
      return
    }

    const result = answerFromIndex(question, repoIndex, memories)
    setAnswer(result.answer)
    setEvidence(result.evidence)
    setActiveStep('ask')
    log(`Answered from repository index: ${question}`)
  }

  function approveMemory() {
    if (!answer || evidence.length === 0) return
    const memory = {
      title: question,
      kind: 'approved_memory',
      confidence: evidence[0]?.confidence ?? '75%',
      detail: answer,
    }
    setMemories((current) => [memory, ...current])
    setActiveStep('memory')
    log(`Approved memory for question: ${question}`)
  }

  function runImpact() {
    if (!repoIndex) {
      setAnswer('Index a repository before running impact analysis.')
      return
    }
    setActiveStep('impact')
    if (!selectedFile && repoIndex.files[0]) setSelectedFile(repoIndex.files[0].path)
    log(`Ran impact analysis for ${selectedFile || repoIndex.files[0]?.path}.`)
  }

  return (
    <main className="site-shell">
      <TopNav page={page} go={go} />
      {page === 'home' ? <HomePage go={go} /> : null}
      {page === 'features' ? <FeaturesPage /> : null}
      {page === 'docs' ? <DocsPage /> : null}
      {page === 'login' ? (
        <LoginPage
          authMode={authMode}
          setAuthMode={setAuthMode}
          authStatus={authStatus}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          signIn={signIn}
        />
      ) : null}
      {page === 'demo' ? (
        <DemoPage demoPlaying={demoPlaying} setDemoPlaying={setDemoPlaying} demoStep={demoStep} setDemoStep={setDemoStep} />
      ) : null}
      {page === 'app' ? (
        <WorkspacePage
          activeStep={activeStep}
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          connectStatus={connectStatus}
          isIndexing={isIndexing}
          connectAndIndexRepository={connectAndIndexRepository}
          repoIndex={repoIndex}
          stats={stats}
          question={question}
          setQuestion={setQuestion}
          askRepository={askRepository}
          answer={answer}
          evidence={evidence}
          memories={memories}
          approveMemory={approveMemory}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          runImpact={runImpact}
          impact={impact}
          activityLog={activityLog}
        />
      ) : null}
    </main>
  )
}

function TopNav({ page, go }: { page: Page; go: (page: Page) => void }) {
  return (
    <header className="topbar">
      <button className="brand nav-button" type="button" onClick={() => go('home')}>
        <BrainCircuit size={28} />
        <span>ProjectMind</span>
      </button>
      <nav className="site-nav">
        {(['features', 'docs', 'login'] as Page[]).map((item) => (
          <button className={page === item ? 'active' : ''} type="button" key={item} onClick={() => go(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>
      <div className="nav-actions">
        <button className="button primary" type="button" onClick={() => go('login')}>
          <GitPullRequest size={18} />
          Connect GitHub
        </button>
        <button className="button secondary" type="button" onClick={() => go('demo')}>
          <Play size={16} />
          Watch Demo
        </button>
      </div>
    </header>
  )
}

function HomePage({ go }: { go: (page: Page) => void }) {
  return (
    <section className="hero-section">
      <div className="hero-grid">
        <div className="hero-copy">
          <h1>Your codebase remembers every decision.</h1>
          <p className="hero-lede">Connect a GitHub repository, index its code and history, then ask questions grounded in real evidence.</p>
          <p className="hero-subline">Ask why, not just what.</p>
          <div className="hero-actions">
            <button className="button primary large" type="button" onClick={() => go('app')}>
              <GitPullRequest size={20} />
              Open Workspace
            </button>
            <button className="button secondary large" type="button" onClick={() => go('demo')}>
              <Play size={18} />
              Watch Demo
            </button>
          </div>
        </div>
        <div className="answer-preview">
          <PanelTitle icon={MessageSquareText} title="Repository workflow" />
          <div className="workflow-stack">
            {demoSteps.map(([title, body], index) => (
              <div className="workflow-card" key={title}>
                <strong>{index + 1}. {title}</strong>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesPage() {
  return (
    <section className="page-section">
      <div className="section-heading">
        <h2>Features</h2>
        <p>Each feature is connected to an actual workflow in the app workspace.</p>
      </div>
      <div className="feature-grid">
        {featureList.map(([title, text]) => (
          <article className="feature-panel" key={title}>
            <Sparkles size={22} />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function DocsPage() {
  return (
    <section className="page-section docs-section">
      <div className="section-heading">
        <h2>Docs</h2>
        <p>How ProjectMind works in this prototype, and what a production OAuth/backend setup adds.</p>
      </div>
      <div className="docs-layout">
        <aside className="docs-nav">
          {demoSteps.map(([title]) => <a href={`#${title.toLowerCase().replaceAll(' ', '-')}`} key={title}>{title}</a>)}
          <a href="#oauth">OAuth setup</a>
        </aside>
        <div className="docs-content">
          {demoSteps.map(([title, body]) => (
            <article className="doc-row" id={title.toLowerCase().replaceAll(' ', '-')} key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
          <article className="doc-row setup" id="oauth">
            <h3>OAuth setup</h3>
            <p>
              Add <code>VITE_GITHUB_CLIENT_ID</code> and <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.local</code> to launch real provider sign-in.
              A production app also needs backend routes like <code>/auth/github/callback</code> and <code>/auth/google/callback</code> to exchange OAuth codes,
              store sessions, and safely access private repositories.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

function LoginPage({
  authMode,
  setAuthMode,
  authStatus,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  signIn,
}: {
  authMode: AuthMode
  setAuthMode: (mode: AuthMode) => void
  authStatus: string
  name: string
  setName: (value: string) => void
  email: string
  setEmail: (value: string) => void
  password: string
  setPassword: (value: string) => void
  signIn: (provider: AuthProvider) => void
}) {
  return (
    <section className="page-section login-page">
      <div className="auth-panel login-card">
        <PanelTitle icon={LockKeyhole} title={authMode === 'signup' ? 'Create account' : 'Sign in'} />
        <div className="auth-tabs">
          <button className={authMode === 'signup' ? 'active' : ''} type="button" onClick={() => setAuthMode('signup')}>Signup</button>
          <button className={authMode === 'signin' ? 'active' : ''} type="button" onClick={() => setAuthMode('signin')}>Signin</button>
        </div>
        <button className="button primary full" type="button" onClick={() => signIn('GitHub')}>
          <GitPullRequest size={18} />
          {authMode === 'signup' ? 'Signup with GitHub' : 'Signin with GitHub'}
        </button>
        <button className="button secondary full" type="button" onClick={() => signIn('Google')}>
          <UserRound size={18} />
          {authMode === 'signup' ? 'Signup with Google' : 'Signin with Google'}
        </button>
        <form className="auth-form" onSubmit={(event) => {
          event.preventDefault()
          signIn('email')
        }}>
          {authMode === 'signup' ? <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" /> : null}
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
          <button className="button secondary full" type="submit">
            <KeyRound size={18} />
            {authMode === 'signup' ? 'Create email account' : 'Signin with email'}
          </button>
        </form>
        <p>Status: {authStatus}</p>
      </div>
    </section>
  )
}

function DemoPage({
  demoPlaying,
  setDemoPlaying,
  demoStep,
  setDemoStep,
}: {
  demoPlaying: boolean
  setDemoPlaying: (playing: boolean) => void
  demoStep: number
  setDemoStep: (step: number) => void
}) {
  const [title, body] = demoSteps[demoStep]
  return (
    <section className="page-section demo-section">
      <div className="section-heading">
        <h2>Watch Demo</h2>
        <p>A live product walkthrough shown as an in-browser video player.</p>
      </div>
      <div className="demo-player">
        <div className="demo-video-bar">
          <span>ProjectMind live demo</span>
          <strong>{demoStep + 1} / {demoSteps.length}</strong>
        </div>
        <div className="demo-frame">
          <div className="demo-sidebar">
            {demoSteps.map(([stepTitle], index) => (
              <button className={index === demoStep ? 'active' : ''} type="button" key={stepTitle} onClick={() => setDemoStep(index)}>
                {index + 1}. {stepTitle}
              </button>
            ))}
          </div>
          <div className="demo-scene">
            <Sparkles size={28} />
            <h3>{title}</h3>
            <p>{body}</p>
            <div className="demo-progress">
              {demoSteps.map(([stepTitle], index) => <i className={index <= demoStep ? 'active' : ''} key={stepTitle} />)}
            </div>
          </div>
        </div>
        <div className="demo-controls">
          <button className="button primary" type="button" onClick={() => setDemoPlaying(!demoPlaying)}>
            {demoPlaying ? <Pause size={17} /> : <Play size={17} />}
            {demoPlaying ? 'Pause demo' : 'Play demo'}
          </button>
          <button className="button secondary" type="button" onClick={() => setDemoStep((demoStep + 1) % demoSteps.length)}>
            Next scene
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}

function WorkspacePage({
  activeStep,
  repoUrl,
  setRepoUrl,
  connectStatus,
  isIndexing,
  connectAndIndexRepository,
  repoIndex,
  stats,
  question,
  setQuestion,
  askRepository,
  answer,
  evidence,
  memories,
  approveMemory,
  selectedFile,
  setSelectedFile,
  runImpact,
  impact,
  activityLog,
}: {
  activeStep: WorkflowStep
  repoUrl: string
  setRepoUrl: (value: string) => void
  connectStatus: string
  isIndexing: boolean
  connectAndIndexRepository: (event?: FormEvent) => void
  repoIndex: RepoIndex | null
  stats: { files: number; commits: number; symbols: number; docs: number }
  question: string
  setQuestion: (value: string) => void
  askRepository: (event: FormEvent) => void
  answer: string
  evidence: Evidence[]
  memories: Evidence[]
  approveMemory: () => void
  selectedFile: string
  setSelectedFile: (value: string) => void
  runImpact: () => void
  impact: ReturnType<typeof analyzeImpact> | null
  activityLog: string[]
}) {
  return (
    <section className="app-frame app-frame-live">
      <aside className="sidebar">
        <div className="sidebar-brand"><BrainCircuit size={22} /> ProjectMind</div>
        <nav className="app-nav">
          {demoSteps.map(([title], index) => {
            const step = ['connect', 'index', 'ask', 'memory', 'impact'][index] as WorkflowStep
            return <button className={activeStep === step ? 'active' : ''} type="button" key={title}>{index + 1}. {title}</button>
          })}
        </nav>
        <div className="index-card">
          <div className="ring">{repoIndex ? '100%' : isIndexing ? '50%' : '0%'}</div>
          <div>
            <strong>{repoIndex ? `${repoIndex.owner}/${repoIndex.repo}` : 'No repository'}</strong>
            <span>{connectStatus}</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-header">
          <div>
            <h2>Repository Workspace</h2>
            <p>{repoIndex ? `Indexed ${repoIndex.owner}/${repoIndex.repo} on ${repoIndex.branch}` : 'Connect a public GitHub repository to begin.'}</p>
          </div>
        </header>

        <div className="live-grid">
          <section className="panel">
            <PanelTitle icon={GitPullRequest} title="1. Connect a repository" />
            <form className="repo-form" onSubmit={connectAndIndexRepository}>
              <input value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/owner/repo" />
              <button className="button primary" type="submit" disabled={isIndexing}>{isIndexing ? 'Indexing...' : 'Connect and index'}</button>
            </form>
            <p className="status-line">{connectStatus}</p>
          </section>

          <section className="panel">
            <PanelTitle icon={Activity} title="2. Index code and history" />
            <div className="status-grid compact-status">
              <StatusCard label="Files" value={String(stats.files)} />
              <StatusCard label="Commits" value={String(stats.commits)} />
              <StatusCard label="Symbols" value={String(stats.symbols)} />
              <StatusCard label="Docs" value={String(stats.docs)} />
            </div>
          </section>

          <section className="panel ask-panel">
            <PanelTitle icon={MessageSquareText} title="3. Ask why" />
            <form className="ask-form" onSubmit={askRepository}>
              <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask anything about the indexed repository" />
              <button type="submit"><Search size={15} /></button>
            </form>
            <div className="answer-block">
              <h4>Answer</h4>
              <p>{answer}</p>
              <EvidenceList evidence={evidence} />
            </div>
          </section>

          <section className="panel memory-panel">
            <PanelTitle icon={History} title="4. Review memory" action="Approve current answer" onAction={approveMemory} />
            <div className="memory-list">
              {memories.map((memory) => <EvidenceCard evidence={memory} key={`${memory.title}-${memory.detail}`} />)}
            </div>
          </section>

          <section className="panel graph-panel">
            <PanelTitle icon={Network} title="5. Run impact analysis" action="Run impact" onAction={runImpact} />
            <select className="file-select" value={selectedFile} onChange={(event) => setSelectedFile(event.target.value)}>
              {(repoIndex?.files ?? []).map((file) => <option value={file.path} key={file.path}>{file.path}</option>)}
            </select>
            {impact ? (
              <div className="impact-summary">
                <strong>{impact.file}</strong>
                <div>
                  <span>Risk</span><b className={impact.risk.toLowerCase()}>{impact.risk}</b>
                  <span>Related files</span><b>{impact.related.length}</b>
                  <span>Tests</span><b>{impact.tests.length}</b>
                </div>
                <p>{impact.summary}</p>
                <EvidenceList evidence={impact.related.slice(0, 4).map((file) => ({ title: file, kind: 'related_file', confidence: '72%', detail: `Shares directory, imports, or naming relationship with ${impact.file}.` }))} />
              </div>
            ) : <p className="status-line">Select a file after indexing, then run impact analysis.</p>}
          </section>

          <section className="panel workbench">
            <PanelTitle icon={BookOpen} title="Activity" />
            <div className="activity-log">{activityLog.map((entry) => <span key={entry}>{entry}</span>)}</div>
          </section>
        </div>
      </div>
    </section>
  )
}

function PanelTitle({ icon: Icon, title, action, onAction }: { icon: typeof Activity; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="panel-title">
      <div><Icon size={17} /><h3>{title}</h3></div>
      {action ? <button type="button" onClick={onAction}>{action}</button> : null}
    </div>
  )
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return <div className="status-card"><span>{label}</span><strong>{value}</strong></div>
}

function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) return null
  return (
    <div className="source-list">
      {evidence.map((item) => <EvidenceCard evidence={item} key={`${item.title}-${item.kind}`} />)}
    </div>
  )
}

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  return (
    <article className="source-row evidence-card">
      <FileCode2 size={14} />
      <span>{evidence.title}</span>
      <small>{evidence.kind}</small>
      <b>{evidence.confidence}</b>
      <p>{evidence.detail}</p>
    </article>
  )
}

function parseGitHubUrl(input: string) {
  const match = input.trim().match(/github\.com[:/](?<owner>[^/\s]+)\/(?<repo>[^/\s#?]+?)(?:\.git)?(?:[/?#].*)?$/i)
  if (!match?.groups) return null
  return { owner: match.groups.owner, repo: match.groups.repo.replace(/\.git$/i, '') }
}

async function buildRepoIndex(owner: string, repo: string): Promise<RepoIndex> {
  const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
  if (!repoResponse.ok) throw new Error(`GitHub could not load ${owner}/${repo}. Make sure it is public or add a backend OAuth token flow.`)
  const repoData = await repoResponse.json() as { default_branch: string }
  const branch = repoData.default_branch

  const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
  if (!treeResponse.ok) throw new Error('GitHub tree API failed while indexing repository files.')
  const treeData = await treeResponse.json() as { tree: Array<{ path: string; type: string; size?: number }> }
  const candidates = treeData.tree
    .filter((item) => item.type === 'blob' && (item.size ?? 0) <= 80000 && isIndexableFile(item.path))
    .slice(0, 55)

  const files = (await Promise.all(candidates.map(async (item) => {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
      const response = await fetch(rawUrl)
      if (!response.ok) return null
      const text = await response.text()
      return { path: item.path, text: text.slice(0, 60000), size: item.size ?? text.length }
    } catch {
      return null
    }
  }))).filter(Boolean) as RepoFile[]

  const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=20`)
  const commitData = commitsResponse.ok ? await commitsResponse.json() as Array<{
    sha: string
    commit: { message: string; author?: { name?: string; date?: string } }
  }> : []
  const commits = commitData.map((item) => ({
    sha: item.sha.slice(0, 7),
    message: item.commit.message.split('\n')[0],
    author: item.commit.author?.name ?? 'unknown',
    date: item.commit.author?.date ?? '',
  }))

  return { owner, repo, branch, files, commits, indexedAt: new Date().toISOString() }
}

function answerFromIndex(question: string, index: RepoIndex, memories: Evidence[]) {
  const terms = tokenize(question)
  const scoredFiles = index.files
    .map((file) => ({ file, score: scoreText(`${file.path}\n${file.text}`, terms) + (isDocFile(file.path) ? 2 : 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const scoredCommits = index.commits
    .map((commit) => ({ commit, score: scoreText(commit.message, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const evidence: Evidence[] = [
    ...scoredFiles.map(({ file, score }) => ({
      title: file.path,
      kind: isDocFile(file.path) ? 'doc_or_readme' : 'code',
      confidence: `${Math.min(95, 55 + score * 6)}%`,
      detail: summarizeFileMatch(file, terms),
    })),
    ...scoredCommits.map(({ commit, score }) => ({
      title: `${commit.sha} ${commit.message}`,
      kind: 'commit',
      confidence: `${Math.min(90, 52 + score * 7)}%`,
      detail: `Commit by ${commit.author}${commit.date ? ` on ${new Date(commit.date).toLocaleDateString()}` : ''}.`,
    })),
    ...memories.filter((memory) => scoreText(`${memory.title} ${memory.detail}`, terms) > 0).slice(0, 2),
  ].slice(0, 6)

  if (evidence.length === 0) {
    return {
      answer: `I indexed ${index.files.length} files and ${index.commits.length} commits from ${index.owner}/${index.repo}, but I did not find strong evidence for "${question}". Try naming a file, dependency, feature, module, error, or term that exists in the repository.`,
      evidence: [
        { title: `${index.owner}/${index.repo}`, kind: 'repository', confidence: '100%', detail: 'Repository is indexed, but no matching file or commit ranked highly for this question.' },
      ],
    }
  }

  const topFiles = scoredFiles.map(({ file }) => file.path).slice(0, 3)
  const topCommits = scoredCommits.map(({ commit }) => `${commit.sha} ${commit.message}`).slice(0, 2)
  const intent = detectIntent(question)
  const answer = [
    `Based on the indexed ${index.owner}/${index.repo} repository, this looks like a ${intent} question.`,
    topFiles.length ? `The strongest evidence is in ${topFiles.join(', ')}.` : '',
    topCommits.length ? `Recent related history includes ${topCommits.join('; ')}.` : '',
    `I found ${evidence.length} evidence item${evidence.length === 1 ? '' : 's'} and ranked them by file path, content, commit message, and approved memory matches.`,
  ].filter(Boolean).join(' ')

  return { answer, evidence }
}

function analyzeImpact(file: RepoFile, files: RepoFile[]) {
  const directory = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : ''
  const base = file.path.split('/').pop()?.replace(/\.[^.]+$/, '').toLowerCase() ?? ''
  const imports = [...file.text.matchAll(/from ['"]([^'"]+)['"]|import\s+[^'"]*['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g)]
    .map((match) => match[1] ?? match[2] ?? match[3])
    .filter(Boolean)

  const related = files
    .filter((candidate) => candidate.path !== file.path)
    .filter((candidate) => {
      const candidateLower = candidate.path.toLowerCase()
      return (!!directory && candidate.path.startsWith(directory)) || (!!base && candidateLower.includes(base)) || imports.some((item) => candidateLower.includes(item.replace('../', '').replace('./', '').toLowerCase()))
    })
    .map((candidate) => candidate.path)
    .slice(0, 12)

  const tests = files.filter((candidate) => /test|spec|__tests__/i.test(candidate.path) && (candidate.path.toLowerCase().includes(base) || candidate.path.startsWith(directory))).map((candidate) => candidate.path)
  const risk = related.length > 8 || imports.length > 8 ? 'High' : related.length > 3 || imports.length > 3 ? 'Medium' : 'Low'

  return {
    file: file.path,
    risk,
    related,
    tests,
    summary: `${file.path} imports ${imports.length} module${imports.length === 1 ? '' : 's'} and has ${related.length} nearby or related file${related.length === 1 ? '' : 's'}. ${tests.length ? `${tests.length} possible test file${tests.length === 1 ? '' : 's'} found.` : 'No obvious test file was found in the indexed set.'}`,
  }
}

function detectIntent(question: string) {
  const lower = question.toLowerCase()
  if (lower.includes('why') || lower.includes('decision')) return 'decision/history'
  if (lower.includes('break') || lower.includes('impact') || lower.includes('change')) return 'impact'
  if (lower.includes('bug') || lower.includes('error')) return 'bug/history'
  if (lower.includes('setup') || lower.includes('run') || lower.includes('install')) return 'setup'
  if (lower.includes('architecture') || lower.includes('structure')) return 'architecture'
  return 'repository understanding'
}

function summarizeFileMatch(file: RepoFile, terms: string[]) {
  const lines = file.text.split('\n')
  const found = lines.find((line) => terms.some((term) => line.toLowerCase().includes(term)))
  if (found) return found.trim().slice(0, 240)
  return `${file.path} matched by path or repository context. Size: ${file.size} bytes.`
}

function scoreText(text: string, terms: string[]) {
  const lower = text.toLowerCase()
  return terms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0)
}

function tokenize(text: string) {
  return text.toLowerCase().split(/[^a-z0-9_./-]+/).filter((term) => term.length > 2 && !['what', 'why', 'how', 'the', 'and', 'for', 'this', 'that', 'does', 'with', 'from'].includes(term)).slice(0, 12)
}

function isDocFile(path: string) {
  return /(^|\/)(readme|docs?|adr|architecture|changelog)|\.(md|mdx|txt|rst)$/i.test(path)
}

function isIndexableFile(path: string) {
  if (/(^|\/)(node_modules|dist|build|coverage|vendor|\.git|public\/assets)(\/|$)/i.test(path)) return false
  return /\.(ts|tsx|js|jsx|py|go|rs|java|cs|php|rb|json|md|mdx|yml|yaml|toml|txt|css|scss|html|sql)$/i.test(path)
}

function estimateSymbols(files: RepoFile[]) {
  return files.reduce((total, file) => total + (file.text.match(/\b(function|class|const|let|var|def|interface|type|enum|struct)\b/g)?.length ?? 0), 0)
}

export default App
