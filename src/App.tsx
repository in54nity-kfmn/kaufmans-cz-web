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

// ─── Black hole ───────────────────────────────────────────────────────────────

function BlackHole({ theme }: { theme: 'dark' | 'light' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const themeRef = useRef(theme)
  useEffect(() => { themeRef.current = theme }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let W = window.innerWidth
    let H = window.innerHeight

    canvas.width = W
    canvas.height = H

    const NUM = 420
    const DARK_COLORS  = ['77,159,255', '200,255,0', '255,255,255', '140,100,255']
    const LIGHT_COLORS = ['180,120,60', '100,140,200', '80,160,80', '160,100,180']

    interface P {
      angle: number
      radius: number
      angSpeed: number
      inSpeed: number
      size: number
      opacity: number
      color: string
    }

    const maxR = () => Math.max(W, H) * 0.7
    const cx = () => W / 2
    const cy = () => H * 0.44

    const isDark = () => themeRef.current === 'dark'

    const spawn = (): P => {
      const r = maxR()
      const colors = isDark() ? DARK_COLORS : LIGHT_COLORS
      // dark: spawn far out, spiral in — light: spawn near center, spiral out
      const radius = isDark()
        ? r * (0.55 + Math.random() * 0.45)
        : r * (0.02 + Math.random() * 0.15)
      return {
        angle: Math.random() * Math.PI * 2,
        radius,
        angSpeed: 0.0008 + Math.random() * 0.0012,
        inSpeed: 0.15 + Math.random() * 0.25,
        size: 1 + Math.random() * 1.8,
        opacity: 0.2 + Math.random() * 0.45,
        color: colors[Math.floor(Math.random() * colors.length)] ?? '100,100,100',
      }
    }

    const particles: P[] = Array.from({ length: NUM }, spawn)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      const CX = cx(), CY = cy(), MR = maxR()

      const dark = isDark()

      // Center overlay — dark void or bright core
      const vd = ctx.createRadialGradient(CX, CY, 0, CX, CY, MR * 0.55)
      if (dark) {
        vd.addColorStop(0,    'rgba(0,0,0,0.96)')
        vd.addColorStop(0.12, 'rgba(0,0,0,0.88)')
        vd.addColorStop(0.3,  'rgba(0,0,0,0.45)')
        vd.addColorStop(0.55, 'rgba(0,0,0,0.08)')
        vd.addColorStop(1,    'rgba(0,0,0,0)')
      } else {
        vd.addColorStop(0,    'rgba(255,250,240,0.96)')
        vd.addColorStop(0.1,  'rgba(255,245,230,0.82)')
        vd.addColorStop(0.28, 'rgba(255,240,220,0.35)')
        vd.addColorStop(0.55, 'rgba(255,240,220,0.06)')
        vd.addColorStop(1,    'rgba(255,240,220,0)')
      }
      ctx.fillStyle = vd
      ctx.fillRect(0, 0, W, H)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!
        const pull = 1 + Math.pow(1 - p.radius / MR, 2) * 5

        if (dark) {
          // Spiral inward
          p.angle  += p.angSpeed * pull
          p.radius -= p.inSpeed * pull * 0.4
          if (p.radius < 18) { particles[i] = spawn(); continue }
        } else {
          // Spiral outward
          p.angle  += p.angSpeed
          p.radius += p.inSpeed * (1 + Math.pow(p.radius / MR, 2) * 2) * 0.35
          if (p.radius > MR) { particles[i] = spawn(); continue }
        }

        const x = CX + Math.cos(p.angle) * p.radius
        const y = CY + Math.sin(p.angle) * p.radius * 0.45

        const progress = p.radius / MR
        const fade = dark
          ? Math.min(progress * 2.5, 1) * Math.min((p.radius - 18) / 50, 1)
          : Math.min((1 - progress) * 2.5, 1) * Math.min(p.radius / 30, 1)
        const dotSize = p.size * (0.3 + progress * 0.7)

        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color},${p.opacity * fade})`
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W
      canvas.height = H
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden="true"
    />
  )
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
      {/* Aurora gradient */}
      <div className="gradient-aurora" aria-hidden="true" />

      {/* Black hole / white hole */}
      <BlackHole theme={theme} />

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
