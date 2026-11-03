import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  Crown,
  Leaf,
  LockKeyhole,
  RotateCcw,
  Share2,
  Sparkles,
  Star,
  Wind,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Trait = 'courage' | 'wisdom' | 'compassion' | 'curiosity'

type Choice = {
  label: string
  detail: string
  next: string
  icon: string
  traits: Partial<Record<Trait, number>>
}

type StoryNode = {
  id: string
  title: string
  text: string
  chapter: string
  image: string
  choices?: Choice[]
  ending?: {
    name: string
    description: string
    mark: string
  }
}

type Answer = {
  question: string
  choice: string
  traits: Partial<Record<Trait, number>>
}

type SavedRun = {
  nodeId: string
  history: string[]
  answers: Answer[]
}

const story: Record<string, StoryNode> = {
  gate: {
    id: 'gate',
    chapter: 'THE FIRST SIGN',
    title: 'The forest knows your name.',
    text: 'At the edge of the old wood, a silver path appears where no path should be. Beyond it, half-hidden by ivy, stands a gate bearing the crest of a kingdom erased from every map.',
    image: 'forest',
    choices: [
      { label: 'Follow the lanterns', detail: 'A trail of warm light winds between the trees.', next: 'willow', icon: '✳', traits: { curiosity: 2, courage: 1 } },
      { label: 'Knock on the gate', detail: 'Three times. Slow and certain.', next: 'door', icon: '⌑', traits: { courage: 2, wisdom: 1 } },
      { label: 'Read the carved crest', detail: 'The stonework may remember what history forgot.', next: 'runes', icon: '⌘', traits: { wisdom: 2, curiosity: 1 } },
      { label: 'Look for another way', detail: 'There is always more than one entrance.', next: 'river', icon: '↗', traits: { compassion: 1, curiosity: 1 } },
    ],
  },
  willow: {
    id: 'willow',
    chapter: 'A QUIETER PATH',
    title: 'A light between the branches.',
    text: 'A willow tree bends over the path, its leaves shining like tiny moons. Something has left a small brass compass at its roots. The needle spins, then points toward a soft voice in the dark.',
    image: 'willow',
    choices: [
      { label: 'Answer the voice', detail: 'Some mysteries are invitations.', next: 'spirit', icon: '♫', traits: { compassion: 2, courage: 1 } },
      { label: 'Take the compass onward', detail: 'The needle is pointing somewhere.', next: 'bridge', icon: '⌖', traits: { curiosity: 2, wisdom: 1 } },
    ],
  },
  door: {
    id: 'door',
    chapter: 'THE OLD GATE',
    title: 'A voice answers from within.',
    text: 'The gate opens a finger’s width. A watchful figure asks what you have come to protect. Behind them, the kingdom’s towers flicker into view—real, and impossibly far away.',
    image: 'gate',
    choices: [
      { label: 'Promise to protect its people', detail: 'A kingdom is more than its crown.', next: 'guardian', icon: '♡', traits: { compassion: 2, courage: 1 } },
      { label: 'Ask what happened here', detail: 'Listen before making a promise.', next: 'chamber', icon: '◉', traits: { wisdom: 2, curiosity: 1 } },
    ],
  },
  runes: {
    id: 'runes',
    chapter: 'THE OLD LANGUAGE',
    title: 'The stone remembers.',
    text: 'The crest shifts beneath your fingers. Its runes describe a kingdom that once chose its ruler by listening to the land—not by bloodline. Two symbols begin to glow.',
    image: 'runes',
    choices: [
      { label: 'Touch the moon symbol', detail: 'Trust what you feel, not only what you see.', next: 'moon', icon: '☾', traits: { compassion: 1, wisdom: 2 } },
      { label: 'Trace the sun symbol', detail: 'Let the hidden door reveal itself.', next: 'guardian', icon: '☼', traits: { courage: 1, curiosity: 2 } },
    ],
  },
  river: {
    id: 'river',
    chapter: 'BEYOND THE WALL',
    title: 'The river runs uphill.',
    text: 'You find a stream slipping beneath the wall, flowing toward the mountain instead of away from it. Across the water, a narrow bridge leads to a lantern-lit shrine.',
    image: 'river',
    choices: [
      { label: 'Cross the old bridge', detail: 'The bridge looks fragile, but it is standing.', next: 'bridge', icon: '⌁', traits: { courage: 2, curiosity: 1 } },
      { label: 'Follow the river to its source', detail: 'The water may know the way.', next: 'shrine', icon: '≋', traits: { wisdom: 1, compassion: 1 } },
    ],
  },
  spirit: {
    id: 'spirit',
    chapter: 'THE WILLOW KEEPER',
    title: 'The forest speaks in echoes.',
    text: 'A small forest spirit appears, made of bark and starlight. It has guarded the entrance for a hundred years, and asks whether you will help it find the song the kingdom forgot.',
    image: 'spirit',
    choices: [
      { label: 'Stay and listen to its song', detail: 'The answer may be in the silence between notes.', next: 'ending-grove', icon: '♫', traits: { compassion: 2, wisdom: 1 } },
      { label: 'Invite it to come with you', detail: 'No one should have to guard alone.', next: 'guardian', icon: '✧', traits: { compassion: 2, courage: 1 } },
    ],
  },
  bridge: {
    id: 'bridge',
    chapter: 'THE DIVIDED KINGDOM',
    title: 'A choice over open water.',
    text: 'Halfway across, the bridge trembles. Below, a tiny boat is caught in the current. On the far bank, the palace doors have begun to close.',
    image: 'bridge',
    choices: [
      { label: 'Help the boat first', detail: 'There is time to save both, if you are quick.', next: 'ending-dawn', icon: '↗', traits: { compassion: 2, courage: 1 } },
      { label: 'Run for the palace doors', detail: 'The kingdom’s secret cannot wait.', next: 'chamber', icon: '➜', traits: { courage: 2, curiosity: 1 } },
    ],
  },
  guardian: {
    id: 'guardian',
    chapter: 'THE LAST SENTINEL',
    title: 'The guardian lowers their sword.',
    text: 'The sentinel sees the old crest in your hand. Their armor is cracked, but their voice is kind. “The crown is still here,” they say. “But the kingdom needs something else.”',
    image: 'guardian',
    choices: [
      { label: 'Ask how you can help', detail: 'A good leader starts by listening.', next: 'ending-keeper', icon: '♡', traits: { compassion: 2, wisdom: 1 } },
      { label: 'Search for the crown', detail: 'The answer may be waiting in the palace.', next: 'moon', icon: '♕', traits: { courage: 1, curiosity: 2 } },
    ],
  },
  chamber: {
    id: 'chamber',
    chapter: 'THE HEART OF THE PALACE',
    title: 'The crown is not what you expected.',
    text: 'Inside the palace, there is no throne. Instead, a crown of roots grows around a pool of clear water. A reflection appears in its surface—someone who looks very much like you.',
    image: 'chamber',
    choices: [
      { label: 'Place the crown back in the earth', detail: 'Perhaps power belongs to the land itself.', next: 'ending-dawn', icon: '♧', traits: { wisdom: 2, compassion: 1 } },
      { label: 'Lift the crown and claim its story', detail: 'You have come this far for a reason.', next: 'ending-crown', icon: '♕', traits: { courage: 2, curiosity: 1 } },
    ],
  },
  moon: {
    id: 'moon',
    chapter: 'THE MOONLIT HALL',
    title: 'An answer, reflected.',
    text: 'The moon symbol opens a hidden hall. Its walls are mirrors, each showing a different version of the kingdom. In one, the people are waiting for you. In another, they are already free.',
    image: 'moon',
    choices: [
      { label: 'Choose the kingdom that is already free', detail: 'Some endings are better left unwritten.', next: 'ending-grove', icon: '☾', traits: { wisdom: 2, compassion: 1 } },
      { label: 'Bring the people back together', detail: 'A new beginning takes a brave first step.', next: 'ending-keeper', icon: '✧', traits: { courage: 1, compassion: 1, curiosity: 1 } },
    ],
  },
  shrine: {
    id: 'shrine',
    chapter: 'THE SOURCE',
    title: 'The river has been waiting.',
    text: 'At its source, water rises from a stone bowl. Beside it lies a small crown, wrapped in a note: “For the one who finds us, not the one who seeks to rule.”',
    image: 'shrine',
    choices: [
      { label: 'Leave the crown and restore the spring', detail: 'The kingdom needs its lifeblood more than a ruler.', next: 'ending-grove', icon: '≋', traits: { compassion: 2, wisdom: 1 } },
      { label: 'Take the note to the people', detail: 'They deserve to choose their own future.', next: 'ending-crown', icon: '✉', traits: { courage: 1, wisdom: 1, curiosity: 1 } },
    ],
  },
  'ending-grove': {
    id: 'ending-grove',
    chapter: 'YOUR STORY, FOR NOW',
    title: 'The kingdom grows wild again.',
    text: 'The old forest reclaims the forgotten paths. In the years to come, people will tell stories of a traveler who taught the land to sing.',
    image: 'ending-grove',
    ending: { name: 'The Wildheart', description: 'You found a way forward by tending what was already alive. The kingdom will remember your gentleness as its greatest kind of courage.', mark: '✳' },
  },
  'ending-dawn': {
    id: 'ending-dawn',
    chapter: 'YOUR STORY, FOR NOW',
    title: 'A new day finds the kingdom.',
    text: 'The river runs clear, the gates stand open, and the people return. The crown is set aside. For the first time in a hundred years, the kingdom decides what it will become together.',
    image: 'ending-dawn',
    ending: { name: 'The Dawnbringer', description: 'You changed the story by looking beyond the obvious prize. Your instinct to act with care gave an entire kingdom room to begin again.', mark: '☼' },
  },
  'ending-keeper': {
    id: 'ending-keeper',
    chapter: 'YOUR STORY, FOR NOW',
    title: 'The people choose a keeper.',
    text: 'The sentinel lays down their sword. One by one, the people step into the square—not to kneel, but to stand beside you. The crown becomes a promise, shared by everyone.',
    image: 'ending-keeper',
    ending: { name: 'The Steadfast Keeper', description: 'You earned trust by making space for others. In a kingdom used to being ruled, your most powerful move was choosing to listen.', mark: '⌑' },
  },
  'ending-crown': {
    id: 'ending-crown',
    chapter: 'YOUR STORY, FOR NOW',
    title: 'A crown becomes a question.',
    text: 'You carry the crown into the open air. It does not fit—not yet. The people gather around, and together you begin the harder work of deciding what a just kingdom should be.',
    image: 'ending-crown',
    ending: { name: 'The Unwritten Crown', description: 'You were willing to step into uncertainty rather than leave the hard work to someone else. The next chapter belongs to the choices you make with others.', mark: '♕' },
  },
}

const traitLabels: Record<Trait, string> = {
  courage: 'Courage',
  wisdom: 'Wisdom',
  compassion: 'Compassion',
  curiosity: 'Curiosity',
}
const traitIcons: Record<Trait, typeof Wind> = {
  courage: Wind,
  wisdom: BookOpen,
  compassion: Leaf,
  curiosity: Compass,
}
const STORAGE_KEY = 'mythos-current-adventure-v1'

function readSavedRun(): SavedRun | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as SavedRun
    if (!story[saved.nodeId] || !Array.isArray(saved.history) || !Array.isArray(saved.answers)) return null
    return saved
  } catch {
    return null
  }
}

function App() {
  const [savedRun] = useState(readSavedRun)
  const [screen, setScreen] = useState<'home' | 'adventure'>(
    () => window.location.pathname.startsWith('/quiz/') ? 'adventure' : 'home',
  )
  const [nodeId, setNodeId] = useState(savedRun?.nodeId ?? 'gate')
  const [history, setHistory] = useState<string[]>(savedRun?.history ?? [])
  const [answers, setAnswers] = useState<Answer[]>(savedRun?.answers ?? [])
  const [notice, setNotice] = useState('')
  const [resumeAvailable, setResumeAvailable] = useState(Boolean(savedRun && savedRun.answers.length))
  const [selected, setSelected] = useState<number | null>(null)
  const [aiReflection, setAiReflection] = useState('')
  const [aiInsight, setAiInsight] = useState('')
  const [aiBusy, setAiBusy] = useState(false)

  const current = story[nodeId] ?? story.gate
  const traits = useMemo(() => {
    const totals: Record<Trait, number> = { courage: 0, wisdom: 0, compassion: 0, curiosity: 0 }
    for (const answer of answers) {
      for (const trait of Object.keys(answer.traits) as Trait[]) totals[trait] += answer.traits[trait] ?? 0
    }
    return totals
  }, [answers])
  const totalAnswers = 4
  const progress = current.ending ? 100 : Math.min(93, Math.round((answers.length / totalAnswers) * 100))

  useEffect(() => {
    if (!answers.length) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodeId, history, answers } satisfies SavedRun))
  }, [answers, history, nodeId])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const begin = (resume = false) => {
    if (!resume) {
      setNodeId('gate')
      setHistory([])
      setAnswers([])
      setSelected(null)
      setResumeAvailable(false)
    } else if (savedRun) {
      setNodeId(savedRun.nodeId)
      setHistory(savedRun.history)
      setAnswers(savedRun.answers)
    }
    setScreen('adventure')
    if (!window.location.pathname.startsWith('/quiz/')) window.history.pushState({}, '', '/quiz/forgotten-kingdom')
  }

  const choose = (choice: Choice, index: number) => {
    setSelected(index)
    window.setTimeout(() => {
      setAnswers((previous) => [...previous, { question: current.title, choice: choice.label, traits: choice.traits }])
      setHistory((previous) => [...previous, nodeId])
      setNodeId(choice.next)
      setSelected(null)
    }, 180)
  }

  const goBack = () => {
    if (!history.length || current.ending) return
    const previousNode = history[history.length - 1]
    setNodeId(previousNode)
    setHistory((previous) => previous.slice(0, -1))
    setAnswers((previous) => previous.slice(0, -1))
    setSelected(null)
  }

  const restart = () => {
    setNodeId('gate')
    setHistory([])
    setAnswers([])
    setAiReflection('')
    setAiInsight('')
    setResumeAvailable(false)
    setSelected(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const requestAiReflection = async () => {
    setAiBusy(true)
    setAiReflection('')
    setAiInsight('')
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
      const response = await fetch(`${apiBase}/api/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          ending: current.ending?.name,
          profile: profile.title,
        }),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        const message = isRecord(result) && typeof result.error === 'string' ? result.error : 'AI reflection is unavailable right now.'
        throw new Error(message)
      }
      if (!isRecord(result) || typeof result.reflection !== 'string' || typeof result.insight !== 'string') {
        throw new Error('The AI service returned an unexpected response.')
      }
      setAiReflection(result.reflection)
      setAiInsight(result.insight)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not generate an AI reflection.')
    } finally {
      setAiBusy(false)
    }
  }

  const shareResult = async () => {
    const result = resultProfile(traits, current.ending?.name)
    const shareData = { title: `My Mythos result: ${result.title}`, text: `I found my place in the Forgotten Kingdom: ${result.title}. What will your choices reveal?`, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        setNotice('Your adventure result link is copied.')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') setNotice('Could not share right now. Please try again.')
    }
  }

  const exitToHome = () => {
    setScreen('home')
    window.history.pushState({}, '', '/')
  }

  const isEmbed = window.location.pathname.startsWith('/quiz/')
  const profile = resultProfile(traits, current.ending?.name)

  return (
    <div className={`app-shell${isEmbed ? ' embed-shell' : ''}`}>
      {!isEmbed && (
        <header className="topbar">
          <a className="brand" href="/" onClick={(event) => { event.preventDefault(); exitToHome() }} aria-label="Mythos home">
            <span className="brand-mark"><Sparkles size={16} /></span>
            <span>mythos<span className="brand-period">.</span></span>
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#adventure">The adventure</a>
          </nav>
          <button className="nav-cta" onClick={() => begin()}>{screen === 'adventure' ? 'Restart story' : 'Begin your story'} <ArrowUpRight size={15} /></button>
        </header>
      )}

      <AnimatePresence mode="wait">
        {screen === 'home' ? (
          <motion.main key="home" className="home-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <section className="hero-section" id="adventure">
              <div className="hero-photo" aria-hidden="true" />
              <div className="hero-shade" aria-hidden="true" />
              <div className="hero-content">
                <div className="eyebrow"><span className="eyebrow-dot" /> AN INTERACTIVE STORY, MADE FOR YOU</div>
                <h1>Every choice<br />opens <em>a world.</em></h1>
                <p className="hero-copy">Somewhere beyond the old forest, a forgotten kingdom is waiting. The way you find it is entirely your own.</p>
                <div className="hero-actions">
                  <button className="button button-light" onClick={() => begin()}>{resumeAvailable ? 'Start a new adventure' : 'Start your adventure'} <ArrowRight size={17} /></button>
                  <span className="hero-duration"><span className="duration-dot" /> A 5-minute story</span>
                </div>
                <div className="hero-footnote"><span className="sparkle-small">✳</span> No two journeys are quite the same</div>
              </div>
              <div className="hero-vertical-note">THE MYSTERY OF THE FORGOTTEN KINGDOM <span>—</span> CHAPTER I</div>
              <div className="hero-index">01 <span>/</span> 04</div>
              <div className="hero-card">
                <span className="hero-card-icon"><Compass size={18} /></span>
                <span><strong>A world that listens</strong><small>Your choices shape the story</small></span>
                <ArrowUpRight size={16} className="card-arrow" />
              </div>
            </section>

            <section className="story-intro" id="how-it-works">
              <div className="intro-label"><span>01</span> A DIFFERENT KIND OF QUIZ</div>
              <div className="intro-body">
                <h2>Not a quiz.<br /><em>A way in.</em></h2>
                <div className="intro-copy">
                  <p>Step into a living story where the choices you make reveal something about the way you see the world. No scores to chase. No wrong turns.</p>
                  <a className="text-link" href="#chapters">Discover the journey <ArrowDown size={15} /></a>
                </div>
              </div>
              <div className="intro-stats">
                <div><strong>10<span>+</span></strong><small>interconnected moments</small></div>
                <div><strong>04</strong><small>ways the story can end</small></div>
                <div><strong>∞</strong><small>ways to make it yours</small></div>
              </div>
            </section>

            <section className="adventure-feature" id="chapters">
              <div className="feature-image" role="img" aria-label="A misty forest path at twilight" />
              <div className="feature-panel">
                <div className="eyebrow feature-eyebrow"><span className="eyebrow-dot" /> YOUR FIRST ADVENTURE</div>
                <p className="feature-kicker">A MYTHOS ORIGINAL <span>·</span> 5 MIN</p>
                <h2>The Mystery of<br />the Forgotten Kingdom</h2>
                <p className="feature-copy">You discover an ancient kingdom hidden beyond a mysterious forest. Your decisions will determine your journey, the allies you encounter, and how your story ends.</p>
                <div className="feature-tags"><span><Compass size={13} /> Fantasy</span><span><Star size={13} /> All levels</span><span><Sparkles size={13} /> 4 endings</span></div>
                <button className="button button-dark" onClick={() => begin()}>{resumeAvailable ? 'Start a new journey' : 'Enter the kingdom'} <ArrowRight size={17} /></button>
              </div>
            </section>

            <section className="how-section">
              <div className="intro-label"><span>02</span> YOUR JOURNEY, YOUR RULES</div>
              <h2>Follow where<br /><em>curiosity leads.</em></h2>
              <div className="steps-grid">
                <article className="step-card"><span className="step-number">01</span><span className="step-icon"><BookOpen size={18} /></span><h3>Step inside</h3><p>Meet a kingdom in the middle of becoming. Your story begins at the forest’s edge.</p></article>
                <article className="step-card"><span className="step-number">02</span><span className="step-icon"><Wind size={18} /></span><h3>Choose your way</h3><p>Every decision opens a different path. Follow your instincts and see where they take you.</p></article>
                <article className="step-card"><span className="step-number">03</span><span className="step-icon"><Crown size={18} /></span><h3>Find your ending</h3><p>Discover what your choices reveal—and an ending that could only belong to you.</p></article>
              </div>
            </section>
            <footer className="footer"><a className="brand footer-brand" href="/"><span className="brand-mark"><Sparkles size={14} /></span><span>mythos<span className="brand-period">.</span></span></a><span>A little story, a little self-discovery.</span><button onClick={() => begin()}>Take the first step <ArrowRight size={14} /></button></footer>
          </motion.main>
        ) : (
          <motion.main key="adventure" className="adventure-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="quiz-topline">
              <button className="back-link" onClick={history.length && !current.ending ? goBack : exitToHome} aria-label={history.length && !current.ending ? 'Go back one choice' : 'Back to home'}><ArrowLeft size={16} /> <span>{history.length && !current.ending ? 'Back one choice' : 'Leave story'}</span></button>
              <div className="quiz-title"><span className="quiz-title-icon"><Sparkles size={14} /></span> THE FORGOTTEN KINGDOM</div>
              <div className="autosave"><span /> {answers.length ? 'Progress saved' : 'Your story begins'}</div>
            </div>

            <div className="progress-wrap">
              <div className="progress-track"><motion.div className="progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.55, ease: 'easeOut' }} /></div>
              <div className="progress-meta"><span>{current.ending ? 'ADVENTURE COMPLETE' : <>{String(answers.length + 1).padStart(2, '0')} <span>/</span> YOUR JOURNEY</>}</span><span>{current.ending ? '100%' : `${progress}%`}</span></div>
            </div>

            <AnimatePresence mode="wait">
              {current.ending ? (
                <motion.section key={current.id} className="result-layout" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <div className={`result-art scene-${current.image}`}><span className="result-art-mark">{current.ending.mark}</span><div className="result-art-caption">THE MYSTERY OF THE FORGOTTEN KINGDOM <span>·</span> YOUR ENDING</div></div>
                  <div className="result-content">
                    <div className="eyebrow result-eyebrow"><span className="eyebrow-dot" /> YOUR STORY, FOR NOW</div>
                    <h1>{current.title}</h1>
                    <p className="result-ending">{current.text}</p>
                    <div className="result-profile"><div className="result-profile-label"><Sparkles size={15} /> YOUR STORY REVEALS</div><h2>{profile.title}</h2><p>{profile.description}</p></div>
                    <div className="ai-reflection">
                      <div className="ai-reflection-head"><span><Sparkles size={14} /> A CLOSER LOOK</span><span className="ai-optional">OPTIONAL AI</span></div>
                      {aiReflection ? <><p className="ai-reflection-copy">{aiReflection}</p><p className="ai-insight">{aiInsight}</p></> : <p className="ai-prompt">Invite the story to reflect on the choices you made.</p>}
                      <button className="reflection-button" onClick={requestAiReflection} disabled={aiBusy}>{aiBusy ? <><span className="loader-dot" /> Finding the words…</> : <><Sparkles size={13} /> {aiReflection ? 'Generate another reflection' : 'Generate an AI reflection'} <ArrowRight size={13} /></>}</button>
                    </div>
                    <div className="trait-list">
                      {(Object.keys(traitLabels) as Trait[]).map((trait) => {
                        const Icon = traitIcons[trait]
                        const value = Math.max(12, Math.min(100, 25 + traits[trait] * 14))
                        return <div className="trait-row" key={trait}><span className="trait-name"><Icon size={14} /> {traitLabels[trait]}</span><div className="trait-meter"><span style={{ width: `${value}%` }} /></div><span className="trait-value">{value}%</span></div>
                      })}
                    </div>
                    <div className="result-buttons"><button className="button button-dark" onClick={restart}><RotateCcw size={15} /> Begin again</button><button className="button button-outline" onClick={shareResult}><Share2 size={15} /> Share your story</button></div>
                    <div className="result-note"><Check size={14} /> Your choices shaped this ending. Take another path to discover a different one.</div>
                  </div>
                </motion.section>
              ) : (
                <motion.section key={current.id} className="question-layout" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -9 }}>
                  <div className={`question-art scene-${current.image}`}>
                    <div className="art-shade" />
                    <span className="art-badge"><LockKeyhole size={12} /> AN OPEN STORY</span>
                    <div className="art-caption"><span>{current.chapter}</span><strong>Somewhere, beyond the known.</strong></div>
                    <div className="art-vertical">A MYTHOS ORIGINAL <span>—</span> 2026</div>
                  </div>
                  <div className="question-content">
                    <div className="eyebrow question-eyebrow"><span className="eyebrow-dot" /> {current.chapter}</div>
                    <h1>{current.title}</h1>
                    <p className="question-copy">{current.text}</p>
                    <div className="choice-heading"><span>WHAT DO YOU DO?</span><span>CHOOSE ONE</span></div>
                    <div className="choice-list">
                      {current.choices?.map((choice, index) => (
                        <button className={`choice-card${selected === index ? ' choice-selected' : ''}`} key={choice.label} onClick={() => choose(choice, index)} disabled={selected !== null}>
                          <span className="choice-icon">{choice.icon}</span>
                          <span className="choice-text"><strong>{choice.label}</strong><small>{choice.detail}</small></span>
                          <span className="choice-arrow"><ArrowRight size={15} /></span>
                        </button>
                      ))}
                    </div>
                    <div className="save-note"><LockKeyhole size={12} /> Your progress is saved on this device.</div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
            <div className="quiz-footer"><span>MYTHOS <span className="footer-sep">/</span> A STORY THAT'S YOURS</span><span><span className="footer-dot" /> {current.ending ? 'JOURNEY COMPLETE' : 'CHOOSE YOUR OWN WAY'}</span></div>
          </motion.main>
        )}
      </AnimatePresence>
      <AnimatePresence>{notice && <motion.div className="notice" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>{notice}</motion.div>}</AnimatePresence>
      <AnimatePresence>
        {screen === 'home' && resumeAvailable && !isEmbed && (
          <motion.button className="resume-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={() => begin(true)}>
            <span className="resume-icon"><BookOpen size={17} /></span><span><strong>Pick up where you left off</strong><small>Your story is saved on this device.</small></span><ArrowRight size={16} />
          </motion.button>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">{current.ending ? `Adventure complete. ${current.ending.name}.` : `${answers.length} choices made.`}</span>
    </div>
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function resultProfile(traits: Record<Trait, number>, endingName?: string) {
  const highest = (Object.entries(traits) as [Trait, number][]).sort((a, b) => b[1] - a[1])[0][0]
  const profiles: Record<Trait, { title: string; description: string }> = {
    courage: { title: 'The Brave Pathfinder', description: 'You meet the unknown with open eyes and a steady heart. Your choices suggest you trust yourself to find a way through—even when the map runs out.' },
    wisdom: { title: 'The Quiet Seeker', description: 'You look for meaning beneath the first impression. You make room for patience, perspective, and the possibility that a better question can change everything.' },
    compassion: { title: 'The Gentle Force', description: 'You notice who might be left behind. Your decisions put care into action, revealing a strength that makes room for others to grow.' },
    curiosity: { title: 'The Far Wanderer', description: 'You follow the thread of the unexpected. Your story is shaped by a willingness to explore, ask, and find possibility in places others pass by.' },
  }
  const chosen = profiles[highest]
  return endingName ? { ...chosen, endingName } : chosen
}

export default App
