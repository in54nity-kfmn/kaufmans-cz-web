import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useMousePosition() {
  const [pos, setPos] = useState({ x: -9999, y: -9999 })

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return pos
}

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ theme, onToggle }: { theme: 'dark' | 'light'; onToggle: () => void }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-inner container">
        <a href="/" className="nav-logo">K.</a>
        <ul className="nav-links">
          <li>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about') }}>
              about
            </a>
          </li>
          <li>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact') }}>
              contact
            </a>
          </li>
          <li>
            <button className="theme-toggle" onClick={onToggle} aria-label="Toggle theme">
              {theme === 'dark' ? '◑' : '◐'}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-rule" />
        <h1 className="hero-name">KAUFMANS</h1>
        <div className="hero-rule" />
        <p className="hero-tagline">personal space</p>
      </div>
    </section>
  )
}

// ─── About ────────────────────────────────────────────────────────────────────

function About() {
  const { ref: sectionRef, visible: sectionVisible } = useReveal()
  const { ref: bioRef, visible: bioVisible } = useReveal(0.1)
  const { ref: metaRef, visible: metaVisible } = useReveal(0.1)

  return (
    <section
      id="about"
      className="section"
      ref={sectionRef as React.RefObject<HTMLElement>}
    >
      <div className="container">
        <p
          className={`section-label reveal${sectionVisible ? ' visible' : ''}`}
        >
          01 ── about
        </p>
        <p
          className={`about-bio reveal${bioVisible ? ' visible' : ''} reveal-delay-1`}
          ref={bioRef as React.RefObject<HTMLParagraphElement>}
        >
          IT consultant based in Prague. I work at the intersection of
          technology and craft — building things that are useful, honest, and
          considered.
        </p>
        <div
          className={`about-meta reveal${metaVisible ? ' visible' : ''} reveal-delay-2`}
          ref={metaRef as React.RefObject<HTMLDivElement>}
        >
          <span className="meta-tag">Prague, CZ</span>
          <span className="meta-tag meta-tag-accent">
            <span className="blink-dot" />
            open to work
          </span>
        </div>
      </div>
    </section>
  )
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function Contact() {
  const { ref: headingRef, visible: headingVisible } = useReveal(0.1)
  const { ref: linksRef, visible: linksVisible } = useReveal(0.1)

  return (
    <section id="contact" className="section">
      <div className="container">
        <p className="section-label">02 ── contact</p>

        <h2
          className={`contact-heading reveal${headingVisible ? ' visible' : ''}`}
          ref={headingRef as React.RefObject<HTMLHeadingElement>}
        >
          Let's talk.
        </h2>

        <div
          className={`contact-links reveal${linksVisible ? ' visible' : ''} reveal-delay-1`}
          ref={linksRef as React.RefObject<HTMLDivElement>}
        >
          <a
            href="mailto:hello@kaufmans.cz"
            className="contact-link"
          >
            hello@kaufmans.cz
            <span className="link-arrow">↗</span>
          </a>

        </div>

        <footer className="footer">
          <span className="footer-copy">
            © {new Date().getFullYear()} kaufmans.cz
          </span>
          <span className="footer-copy">Prague, CZ</span>
        </footer>
      </div>
    </section>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

function useTabTitle() {
  useEffect(() => {
    const titles = ['Kaufmans', 'kaufmans.cz']
    let i = 0
    let interval: ReturnType<typeof setInterval> | null = null

    const start = () => {
      interval = setInterval(() => {
        i = (i + 1) % titles.length
        document.title = titles[i] ?? 'Kaufmans'
      }, 1200)
    }

    const stop = () => {
      if (interval) clearInterval(interval)
      interval = null
      document.title = 'Kaufmans'
      i = 0
    }

    window.addEventListener('blur', start)
    window.addEventListener('focus', stop)
    return () => {
      stop()
      window.removeEventListener('blur', start)
      window.removeEventListener('focus', stop)
    }
  }, [])
}

export default function App() {
  const mouse = useMousePosition()
  useTabTitle()

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  return (
    <>
      {/* Cursor glow */}
      <div
        className="cursor-glow"
        style={{ left: mouse.x, top: mouse.y }}
        aria-hidden="true"
      />

      <Nav theme={theme} onToggle={toggleTheme} />

      <main>
        <Hero />
        <About />
        <Contact />
      </main>
    </>
  )
}
