/* Deterministic motion-graphics engine: init(spec, timing) builds the scenes, render(t) draws the frame at time t. */
;(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
  const lerp = (a, b, p) => a + (b - a) * p
  const ease = {
    outCubic: (p) => 1 - (1 - p) ** 3,
    outQuart: (p) => 1 - (1 - p) ** 4,
    outExpo: (p) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p)),
    inOutCubic: (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
    outBack: (p) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2,
  }
  const prog = (local, start, dur, fn = ease.outCubic) => fn(clamp((local - start) / dur))

  const ICONS = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/><path d="M12 15v2.5"/>',
    qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 19h1.5M19 14h1.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.8 2 4.8 5"/>',
    feather: '<path d="M20 4C11 4 5 9.5 5 19"/><path d="M5 19c9 0 15-6 15-15"/><path d="M5 19l9-9"/>',
    merge: '<path d="M6 3.5v5a6 6 0 0 0 6 6M18 3.5v5a6 6 0 0 1-6 6v6"/><path d="M9 18l3 3 3-3"/>',
    code: '<path d="M8 6.5L2.5 12 8 17.5M16 6.5l5.5 5.5-5.5 5.5"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    bolt: '<path d="M13 2.5L4.5 13.5h6.5l-1 8 8.5-11h-6.5z"/>',
  }
  const svg = (name) => `<svg viewBox="0 0 24 24">${ICONS[name]}</svg>`

  let SPEC, TIMING, scenes = []
  const imgSrc = (src) => {
    const [kind, path] = src.split(':')
    return SPEC.images[kind] + path
  }
  const el = (cls, html = '') => {
    const e = document.createElement('div')
    e.className = cls
    e.innerHTML = html
    return e
  }
  const place = (e, x, y, w, h) => {
    Object.assign(e.style, { left: `${x}px`, top: `${y}px` })
    if (w) e.style.width = `${w}px`
    if (h) e.style.height = `${h}px`
  }
  const transform = (e, { x = 0, y = 0, s = 1, r = 0, rx = 0, o = 1 }) => {
    e.style.transform = `translate3d(${x}px, ${y}px, 0) rotateX(${rx}deg) rotate(${r}deg) scale(${s})`
    e.style.opacity = o
  }

  // ---------------------------------------------------------------------------------------------- item builders
  const builders = {
    kicker(it, scene) {
      const e = el(`item kicker${it.align === 'center' ? ' center' : ''}`, `<span class="bar"></span><span class="txt">${it.text}</span>`)
      place(e, it.x ?? 120, it.y ?? 112, it.w)
      const bar = e.firstChild, txt = e.lastChild
      return { e, update: (lt) => {
        const p = prog(lt, 0, 0.5)
        bar.style.width = `${48 * p}px`
        txt.style.opacity = prog(lt, 0.15, 0.6)
        txt.style.letterSpacing = `${lerp(0.5, 0.2, prog(lt, 0.15, 0.8, ease.outExpo))}em`
      } }
    },
    title(it) {
      const words = it.text.split(' ').map((w) => `<span class="w"><span>${w}</span></span>`).join(' ')
      const e = el('item title', words)
      place(e, it.x ?? 120, it.y ?? 150, it.w ?? 1680)
      if (it.size) e.style.fontSize = `${it.size}px`
      if (it.align) e.style.textAlign = it.align
      const spans = [...e.querySelectorAll('.w > span')]
      return { e, update: (lt) => spans.forEach((s, i) => {
        const p = prog(lt, i * 0.07, 0.9, ease.outExpo)
        s.style.transform = `translateY(${(1 - p) * 110}%)`
      }) }
    },
    subtitle(it) {
      const e = el('item subtitle', it.text)
      place(e, it.x ?? 120, it.y ?? 250, it.w ?? 1680)
      if (it.align) e.style.textAlign = it.align
      return { e, update: (lt) => { const p = prog(lt, 0, 0.9); transform(e, { y: 30 * (1 - p), o: p }) } }
    },
    logo(it, scene) {
      const e = el('item logo', `${scene.theme === 'dark' ? '<div class="glow"></div>' : ''}<img src="${imgSrc(it.src)}">`)
      place(e, it.x, it.y, it.w, it.h)
      const glow = e.querySelector('.glow')
      return { e, update: (lt) => {
        const p = prog(lt, 0, 1.0, ease.outBack)
        transform(e, { s: lerp(0.3, 1, p), r: lerp(-30, 0, p), o: clamp(p * 2), y: Math.sin(lt * 1.3) * 6 })
        if (glow) glow.style.opacity = 0.6 + 0.4 * Math.sin(lt * 2)
      } }
    },
    shot(it, scene, idx) {
      const capH = it.caption ? (it.sub ? 86 : 52) : 0
      const chrome = it.paper ? 0 : 30
      const img = new Image()
      img.src = imgSrc(it.src)
      const e = el(`item shot${it.paper ? ' paper' : ''}`)
      const frame = el('frame', `${chrome ? '<div class="chrome"><i></i><i></i><i></i></div>' : ''}<div class="view"></div>`)
      frame.querySelector('.view').appendChild(img)
      e.appendChild(frame)
      let cap
      if (it.caption) {
        cap = el('caption', `${it.caption}${it.sub ? `<small>${it.sub}</small>` : ''}`)
        e.appendChild(cap)
      }
      const layout = () => {
        const boxH = it.h - capH - (capH ? 18 : 0)
        const s = Math.min(it.w / img.naturalWidth, (boxH - chrome) / img.naturalHeight)
        const w = img.naturalWidth * s, h = img.naturalHeight * s + chrome
        place(e, it.x, it.y, it.w, it.h)
        place(frame, (it.w - w) / 2, (boxH - h) / 2, w, h)
        frame.querySelector('.view').style.top = `${chrome}px`
        if (cap) { cap.style.top = `${(boxH + h) / 2 + 18}px`; cap.style.left = `${(it.w - w) / 2 + 4}px` }
      }
      img.decode().then(layout)
      const seed = idx * 1.7
      return { e, ready: img.decode().then(layout), update: (lt, sl) => {
        const p = prog(lt, 0, 1.1, ease.outQuart)
        const pb = prog(lt, 0, 1.2, ease.outBack)
        transform(frame, { y: 90 * (1 - p) + Math.sin(sl * 0.7 + seed) * 5, s: lerp(0.88, 1, pb), rx: 16 * (1 - p), o: clamp(p * 2.2) })
        img.style.transform = `scale(${1 + 0.035 * clamp(lt / 12)})`
        if (cap) { const pc = prog(lt, 0.35, 0.8); transform(cap, { y: 16 * (1 - pc), o: pc }) }
      } }
    },
    chips(it, scene) {
      const e = el(`item chips${it.row ? ' row' : ''}`)
      place(e, it.x, it.y, it.w)
      const icon = it.icon ? `<span class="ic img"><img src="${imgSrc(it.icon)}"></span>` : `<span class="ic">${svg('check')}</span>`
      const chips = it.items.map((text) => {
        const c = el('chip', `${it.row ? '' : icon}<span>${text}</span>`)
        e.appendChild(c)
        return c
      })
      return { e, update: (lt) => chips.forEach((c, i) => {
        const p = prog(lt, i * 0.22, 0.7, ease.outBack)
        transform(c, { x: it.row ? 0 : -50 * (1 - p), y: it.row ? 30 * (1 - p) : 0, s: lerp(0.92, 1, p), o: clamp(p * 1.6) })
      }) }
    },
    card(it) {
      const e = el('item card', `<div class="ic">${svg(it.icon)}</div><h3>${it.title}</h3><p>${it.text}</p>`)
      place(e, it.x, it.y, it.w, it.h)
      const ic = e.firstChild
      return { e, update: (lt) => {
        const p = prog(lt, 0, 1.0, ease.outBack)
        transform(e, { y: 70 * (1 - p), s: lerp(0.9, 1, p), o: clamp(p * 2) })
        transform(ic, { s: lerp(0.4, 1, prog(lt, 0.25, 0.8, ease.outBack)), r: lerp(-25, 0, prog(lt, 0.25, 0.8)) })
      } }
    },
    stat(it) {
      const e = el('item card stat', `<div class="num">0</div><h3>${it.label}</h3><p>${it.sub}</p>`)
      place(e, it.x, it.y, it.w, it.h)
      const num = e.firstChild
      return { e, update: (lt) => {
        const p = prog(lt, 0, 1.0, ease.outBack)
        transform(e, { y: 70 * (1 - p), s: lerp(0.9, 1, p), o: clamp(p * 2) })
        num.textContent = Math.round(it.value * prog(lt, 0.1, 1.5, ease.outCubic))
        const pulse = prog(lt, 1.6, 0.5)
        num.style.transform = `scale(${1 + 0.08 * Math.sin(Math.PI * pulse)})`
        num.style.transformOrigin = '0 60%'
      } }
    },
    badge(it) {
      const e = el('item badge', `${it.text}<span class="shine"></span>`)
      place(e, it.x, it.y)
      const shine = e.lastChild
      return { e, update: (lt) => {
        const p = prog(lt, 0, 0.8, ease.outBack)
        transform(e, { s: lerp(0, 1, p), r: lerp(-12, -2, p), o: clamp(p * 3) })
        shine.style.left = `${-80 + ((lt * 160) % 520)}px`
      } }
    },
    toggle(it) {
      const e = el('item toggle', `<div class="knob">${svg('sun')}${svg('moon')}</div>`)
      place(e, it.x, it.y)
      const knob = e.firstChild, [sun, moon] = knob.querySelectorAll('svg')
      return { e, update: (lt) => {
        const p = prog(lt, 0, 0.7, ease.outBack)
        transform(e, { s: lerp(0.5, 1, p), o: clamp(p * 2) })
        const cycle = (Math.max(0, lt - 0.8) % 3.2) / 3.2
        const d = ease.inOutCubic(clamp(cycle < 0.5 ? cycle * 4 - 0.4 : 2.4 - cycle * 4))
        knob.style.transform = `translateX(${86 * d}px) rotate(${360 * d}deg)`
        e.style.background = `rgb(${lerp(242, 19, d)}, ${lerp(214, 48, d)}, ${lerp(130, 43, d)})`
        sun.style.opacity = 1 - d
        sun.style.stroke = '#E2A31B'
        moon.style.opacity = d
        moon.style.stroke = '#13302B'
      } }
    },
    code(it) {
      const e = el('item code')
      place(e, it.x, it.y, it.w)
      const fnLen = it.text.indexOf('(')
      const comment = '// meters: < 0 inside, > 0 outside'
      return { e, update: (lt) => {
        const p = prog(lt, 0, 0.6, ease.outBack)
        transform(e, { y: 40 * (1 - p), s: lerp(0.94, 1, p), o: clamp(p * 2) })
        const n = Math.floor(clamp((lt - 0.4) * 30, 0, it.text.length))
        const shown = it.text.slice(0, n)
        const html = `<span class="fn">${shown.slice(0, fnLen)}</span>${shown.slice(fnLen).replace(/('[^']*'?)/, '<span class="str">$1</span>')}`
        const caret = Math.floor(lt * 2.2) % 2 === 0 || n < it.text.length ? '<span class="caret"></span>' : ''
        const cm = n >= it.text.length ? `\n<span class="cm" style="opacity:${prog(lt, it.text.length / 30 + 0.6, 0.6)}">${comment}</span>` : ''
        e.innerHTML = html + caret + cm
      } }
    },
    legend(it) {
      const rows = [
        ['Inside', 'var(--green-bright)', 'd < −accuracy'],
        ['Outside', 'var(--red)', 'd > accuracy'],
        ['Uncertain', 'var(--amber)', '|d| ≤ accuracy'],
      ]
      const e = el('item legend', rows.map(([l, c, r]) => `<div class="row"><span class="dot" style="background:${c}"></span>${l}<small>${r}</small></div>`).join(''))
      place(e, it.x, it.y, it.w)
      const els = [...e.children]
      return { e, update: (lt) => els.forEach((r, i) => {
        const p = prog(lt, i * 0.9, 0.7, ease.outBack)
        transform(r, { x: -40 * (1 - p), o: clamp(p * 2) })
      }) }
    },
    speed(it) {
      const e = el('item speed', `<div class="card"><div class="lead"><div class="ic">${svg('bolt')}</div><h3>Importing large records</h3></div>
        <div class="bars"><div class="bar-row before"><span>Before</span><div class="track"><div class="fill"></div></div><span class="val">minutes</span></div>
        <div class="bar-row now"><span>Now</span><div class="track"><div class="fill"></div></div><span class="val">seconds</span></div></div></div>`)
      place(e, it.x, it.y, it.w, it.h)
      const [bf, nf] = e.querySelectorAll('.fill'), [bv, nv] = e.querySelectorAll('.val')
      return { e, update: (lt) => {
        const p = prog(lt, 0, 0.9, ease.outBack)
        transform(e, { y: 60 * (1 - p), s: lerp(0.94, 1, p), o: clamp(p * 2) })
        bf.style.width = `${100 * prog(lt, 0.5, 3.2, (x) => x)}%`
        bv.style.opacity = prog(lt, 0.6, 0.5)
        nf.style.width = `${7 * prog(lt, 1.6, 0.35)}%`
        const pn = prog(lt, 1.9, 0.6, ease.outBack)
        transform(nv, { s: lerp(0.3, 1, pn), o: clamp(pn * 2) })
      } }
    },
    url(it) {
      const e = el('item url', `<span>${svg('code')}${it.text}</span>`)
      place(e, it.x, it.y, it.w)
      return { e, update: (lt) => { const p = prog(lt, 0, 0.9, ease.outBack); transform(e, { y: 40 * (1 - p), s: lerp(0.85, 1, p), o: clamp(p * 2) }) } }
    },
    aoiMap(it, scene) {
      return aoiMap(it, scene)
    },
  }

  // ---------------------------------------------------------------------------------------------- AOI animated map
  function aoiMap(it, scene) {
    const W = it.w, H = it.h
    const poly = [[250, 120], [560, 95], [770, 215], [745, 470], [530, 600], [255, 535], [150, 320]]
    const pts = [
      { p: [420, 330], acc: 12, status: 'inside', label: 'Inside' },
      { p: [880, 590], acc: 16, status: 'outside', label: 'Outside' },
      { p: [728, 370], acc: 34, status: 'uncertain', label: 'Uncertain' },
    ]
    const M_PER_PX = 4.6
    const nearest = ([x, y]) => {
      let best = null
      poly.forEach((a, i) => {
        const b = poly[(i + 1) % poly.length]
        const dx = b[0] - a[0], dy = b[1] - a[1]
        const u = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy))
        const q = [a[0] + u * dx, a[1] + u * dy]
        const d = Math.hypot(x - q[0], y - q[1])
        if (!best || d < best.d) best = { q, d }
      })
      return best
    }
    const colors = { inside: '#2FA36B', outside: '#D9534F', uncertain: '#F0A030' }
    let fields = ''
    let seed = 3
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let gx = -1; gx < 9; gx++) for (let gy = -1; gy < 7; gy++) {
      const x = gx * 125 + rnd() * 30, y = gy * 115 + rnd() * 30
      const shade = ['#CFDDC0', '#DCE5CF', '#C3D5B4', '#E4E8D5', '#BFD0AE'][Math.floor(rnd() * 5)]
      fields += `<rect x="${x}" y="${y}" width="${110 + rnd() * 30}" height="${100 + rnd() * 25}" rx="6" fill="${shade}" transform="rotate(${-8 + rnd() * 6} ${x} ${y})"/>`
    }
    const polyStr = poly.map((p) => p.join(',')).join(' ')
    const perim = poly.reduce((s, a, i) => { const b = poly[(i + 1) % poly.length]; return s + Math.hypot(b[0] - a[0], b[1] - a[1]) }, 0)
    const pointSvg = pts.map((pt, i) => {
      const n = nearest(pt.p)
      pt.n = n
      const inside = pt.status !== 'outside'
      pt.m = Math.round(n.d * M_PER_PX) * (inside ? -1 : 1)
      const mid = [(pt.p[0] + n.q[0]) / 2, (pt.p[1] + n.q[1]) / 2]
      return `<g class="pt" id="pt${i}">
        <circle class="acc" cx="${pt.p[0]}" cy="${pt.p[1]}" r="0" fill="${colors[pt.status]}" fill-opacity=".18" stroke="${colors[pt.status]}" stroke-width="2.5" stroke-dasharray="6 6"/>
        <line class="dl" x1="${pt.p[0]}" y1="${pt.p[1]}" x2="${n.q[0]}" y2="${n.q[1]}" stroke="#13302B" stroke-width="3" stroke-dasharray="8 6"/>
        <g class="dlabel" transform="translate(${mid[0] + (i === 2 ? -105 : 14)}, ${mid[1] - 18})"><rect x="0" y="-22" width="${`${Math.abs(pt.m)}`.length * 14 + 66}" height="34" rx="17" fill="#13302B"/><text x="14" y="2" fill="#fff">${pt.m > 0 ? '+' : '−'}${Math.abs(pt.m)} m</text></g>
        <g class="pin"><circle cx="${pt.p[0]}" cy="${pt.p[1]}" r="15" fill="#fff"/><circle class="core" cx="${pt.p[0]}" cy="${pt.p[1]}" r="9" fill="#13302B"/></g>
        <g transform="translate(${pt.p[0] + (i === 1 ? -170 : 26)}, ${pt.p[1] + 44})"><g class="tag"><rect x="0" y="-24" width="${pt.label.length * 15 + 34}" height="40" rx="20" fill="${colors[pt.status]}"/><text x="17" y="4" fill="#fff">${pt.label}</text></g></g>
      </g>`
    }).join('')
    const e = el('item aoiMap', `<div class="frame"><svg viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#D7E2C9"/>${fields}
      <path d="M-20 600 C 200 520, 330 690, 560 640 S 860 520, 990 560" stroke="#9FC3DA" stroke-width="30" fill="none" stroke-linecap="round"/>
      <path d="M-20 60 L 980 260 M 610 -20 L 520 720" stroke="#F4F1E6" stroke-width="10" fill="none"/>
      <polygon class="aoi-fill" points="${polyStr}" fill="#2FA36B" fill-opacity="0"/>
      <polygon class="aoi-line" points="${polyStr}" fill="none" stroke="#1E7A52" stroke-width="5" stroke-linejoin="round" stroke-dasharray="${perim}" stroke-dashoffset="${perim}"/>
      <g class="aoi-name" transform="translate(300, 90)"><rect x="0" y="-26" width="150" height="40" rx="20" fill="#1E7A52"/><text x="18" y="2" fill="#fff">pilot_area</text></g>
      ${pointSvg}</svg></div>`)
    place(e, it.x, it.y, W, H)
    const q = (s) => e.querySelector(s)
    const line = q('.aoi-line'), fill = q('.aoi-fill'), name = q('.aoi-name')
    const groups = pts.map((pt, i) => ({
      pin: q(`#pt${i} .pin`), core: q(`#pt${i} .core`), dl: q(`#pt${i} .dl`), dlabel: q(`#pt${i} .dlabel`), acc: q(`#pt${i} .acc`), tag: q(`#pt${i} .tag`),
    }))
    const segRel = (k) => scene.segs[k].start - scene.start
    return { e, update: (lt) => {
      const p = prog(lt, 0, 1.0, ease.outQuart)
      transform(e, { y: 60 * (1 - p), s: lerp(0.94, 1, p), o: clamp(p * 2) })
      const pd = prog(lt, 0.8, 2.0, ease.inOutCubic)
      line.setAttribute('stroke-dashoffset', perim * (1 - pd))
      fill.setAttribute('fill-opacity', 0.2 * prog(lt, 2.4, 0.8))
      name.style.opacity = prog(lt, 2.6, 0.5)
      const s1 = segRel(1), s2 = segRel(2)
      pts.forEach((pt, i) => {
        const g = groups[i]
        const pp = prog(lt, s1 + 0.5 + i * 0.45, 0.7, ease.outBack)
        g.pin.style.opacity = clamp(pp * 3)
        g.pin.setAttribute('transform', `translate(0 ${-50 * (1 - pp)})`)
        const pl = prog(lt, s1 + 2.6 + i * 0.9, 0.8, ease.inOutCubic)
        const n = pt.n
        g.dl.setAttribute('x2', lerp(pt.p[0], n.q[0], pl))
        g.dl.setAttribute('y2', lerp(pt.p[1], n.q[1], pl))
        g.dl.style.opacity = pl > 0 ? 1 : 0
        const plb = prog(lt, s1 + 3.2 + i * 0.9, 0.5, ease.outBack)
        g.dlabel.style.opacity = clamp(plb * 2)
        const pa = prog(lt, s2 + 0.3 + i * 0.9, 1.0, ease.outBack)
        const pulse = pa >= 1 ? 1 + 0.06 * Math.sin((lt - s2) * 3 + i) : 1
        g.acc.setAttribute('r', pt.acc * pa * pulse)
        g.core.setAttribute('fill', pa > 0.5 ? colors[pt.status] : '#13302B')
        const pt2 = prog(lt, s2 + 0.8 + i * 0.9, 0.6, ease.outBack)
        g.tag.style.opacity = clamp(pt2 * 2)
        g.tag.style.transform = `scale(${lerp(0.6, 1, pt2)})`
        g.tag.style.transformBox = 'fill-box'
        g.tag.style.transformOrigin = 'center'
      })
    } }
  }

  // ---------------------------------------------------------------------------------------------- background
  function contours() {
    let d = ''
    for (let k = 1; k <= 16; k++) {
      const pts = []
      for (let a = 0; a <= 64; a++) {
        const th = (a / 64) * Math.PI * 2
        const r = k * 70 * (1 + 0.08 * Math.sin(th * 3 + k) + 0.05 * Math.cos(th * 5 - k * 0.7))
        pts.push(`${(1500 + r * Math.cos(th)).toFixed(1)},${(820 + r * 0.75 * Math.sin(th)).toFixed(1)}`)
      }
      d += `<path d="M${pts.join('L')}Z"/>`
    }
    document.getElementById('contours').innerHTML = d
  }

  function drawBackground(t, dark) {
    const set = (sel, x, y) => { document.querySelector(sel).style.transform = `translate(${x}px, ${y}px)` }
    set('.b1', -300 + 220 * Math.sin(t * 0.07), -400 + 160 * Math.cos(t * 0.05))
    set('.b2', 1200 + 200 * Math.cos(t * 0.06), 300 + 180 * Math.sin(t * 0.08))
    set('.b3', 400 + 260 * Math.sin(t * 0.045 + 2), 500 + 140 * Math.cos(t * 0.06))
    set('.d1', -200 + 300 * Math.sin(t * 0.06), -300 + 200 * Math.cos(t * 0.05))
    set('.d2', 1100 + 260 * Math.cos(t * 0.05), 250 + 200 * Math.sin(t * 0.07))
    document.querySelector('.dots').style.transform = `translate(${(t * 6) % 32}px, ${(t * 3) % 32}px)`
    document.getElementById('contours').style.transform = `rotate(${t * 0.6}deg) scale(${1.05 + 0.03 * Math.sin(t * 0.2)})`
    document.getElementById('contours').style.transformOrigin = '1500px 820px'
    document.getElementById('bg-dark').style.opacity = dark
    const wm = document.getElementById('watermark')
    wm.style.opacity = 0.85 * (1 - dark)
  }

  // ---------------------------------------------------------------------------------------------- public API
  window.init = (spec, timing) => {
    SPEC = spec
    TIMING = timing
    contours()
    const root = document.getElementById('scenes')
    const ready = []
    scenes = spec.scenes.map((sc, k) => {
      const tm = timing.scenes[k]
      const scene = { ...sc, ...tm, theme: sc.theme || 'light' }
      const div = el(`scene ${scene.theme}`)
      root.appendChild(div)
      let order = 0
      scene.items = sc.items.map((it, idx) => {
        const b = builders[it.type](it, scene, idx)
        div.appendChild(b.e)
        if (b.ready) ready.push(b.ready)
        const at = it.at || 0
        const base = at === 0 ? 0.1 + 0.16 * order++ : tm.segs[at].start - tm.start
        return { ...b, enter: base + (it.delay || 0) }
      })
      scene.div = div
      return scene
    })
    return Promise.all([document.fonts.ready, ...ready]).then(() => true)
  }

  const REVEAL_R = 1250
  const mask = (e, r, inside) => {
    const m = r === null ? 'none'
      : `radial-gradient(circle at 50% 55%, ${inside ? '#000' : 'transparent'} ${r}px, ${inside ? 'transparent' : '#000'} ${r + 2}px)`
    e.style.webkitMaskImage = m
    e.style.maskImage = m
  }

  // light <-> dark switch in progress: the new scene opens from the centre, the old one stays still until covered
  const themeSwitch = (t) => {
    for (let k = 1; k < scenes.length; k++) {
      const a = scenes[k - 1], b = scenes[k]
      const lt = t - b.start
      if (a.theme !== b.theme && lt >= 0 && lt <= TIMING.xf) return { a, b, r: REVEAL_R * ease.inOutCubic(lt / TIMING.xf) }
    }
    return null
  }

  window.render = (t) => {
    const xf = TIMING.xf
    const sw = themeSwitch(t)
    let darkW = 0, weight = 0
    for (const sc of scenes) {
      const lt = t - sc.start
      const visible = lt >= 0 && lt <= sc.dur
      sc.div.style.display = visible ? 'block' : 'none'
      if (!visible) continue
      const out = clamp((lt - (sc.dur - xf)) / xf)
      const inn = clamp(lt / xf)
      const isLast = sc === scenes[scenes.length - 1]
      for (const it of sc.items) it.update(lt - it.enter, lt)
      if (sw && (sc === sw.a || sc === sw.b)) {
        sc.div.style.opacity = 1
        sc.div.style.transform = 'none'
        mask(sc.div, sw.r, sc === sw.b)
        continue
      }
      mask(sc.div, null)
      sc.div.style.opacity = isLast ? 1 - clamp((lt - (sc.dur - 1.2)) / 1.2) : (1 - out) ** 2
      sc.div.style.transform = `translateY(${-50 * ease.inOutCubic(out)}px) scale(${1 - 0.03 * out})`
      const w = Math.min(inn, 1 - out) + 1e-6
      darkW += (sc.theme === 'dark' ? 1 : 0) * w
      weight += w
    }
    const bgDark = document.getElementById('bg-dark')
    const ring = document.getElementById('ring')
    if (sw) {
      drawBackground(t, 1)
      mask(bgDark, sw.r, sw.b.theme === 'dark')
      Object.assign(ring.style, { display: 'block', width: `${2 * sw.r}px`, height: `${2 * sw.r}px`,
        left: `${960 - sw.r}px`, top: `${594 - sw.r}px`, opacity: Math.sin(Math.PI * sw.r / REVEAL_R) })
      document.getElementById('watermark').style.opacity = 0
    } else {
      drawBackground(t, weight ? Math.round(darkW / weight) : 0)
      mask(bgDark, null)
      ring.style.display = 'none'
    }
    // light sweep across the other transitions
    const sweep = document.getElementById('sweep')
    let swept = false
    for (const sc of scenes.slice(1)) {
      const p = (t - (sc.start - 0.1)) / (xf + 0.5)
      if (!sw && p >= 0 && p <= 1) {
        swept = true
        sweep.style.left = `${lerp(-700, 2300, ease.inOutCubic(p))}px`
        sweep.style.opacity = Math.sin(Math.PI * p)
      }
    }
    if (!swept) sweep.style.opacity = 0
    document.getElementById('progress-fill').style.width = `${(100 * t) / TIMING.total}%`
  }
})()
