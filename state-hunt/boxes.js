// The 30 boxes of the State Hunt. Each one is a real React component, and the answer key reads
// its useState lines straight from the component's source, so the code shown is the code running.
import React, { useState, useEffect } from 'react'

const h = React.createElement
const btn = (label, onClick, extra = {}) => h('button', { type: 'button', onClick, ...extra }, label)

function LightSwitch() {
  const [isOn, setIsOn] = useState(false)
  return h('div', { className: 'col' },
    h('div', { className: 'bulb' + (isOn ? ' on' : '') }, '💡'),
    btn(isOn ? 'Turn off' : 'Turn on', () => setIsOn(!isOn)))
}

function Counter() {
  const [count, setCount] = useState(0)
  return h('div', { className: 'row' },
    btn('−', () => setCount((c) => c - 1)), h('span', { className: 'big' }, count), btn('+', () => setCount((c) => c + 1)))
}

function VolumeSlider() {
  const [volume, setVolume] = useState(50)
  return h('div', { className: 'col' },
    h('input', { type: 'range', min: 0, max: 100, value: volume, onChange: (e) => setVolume(Number(e.target.value)), 'aria-label': 'Volume' }),
    h('span', { className: 'big' }, (volume === 0 ? '🔇 ' : '🔊 ') + volume))
}

function LikeButton() {
  const [liked, setLiked] = useState(false)
  const likes = 41 + (liked ? 1 : 0)
  return h('div', { className: 'row' },
    btn(liked ? '♥' : '♡', () => setLiked(!liked), { className: 'heart' + (liked ? ' on' : ''), 'aria-label': 'Like' }),
    h('span', null, likes + ' likes'))
}

function StarRating() {
  const [rating, setRating] = useState(0)
  return h('div', { className: 'col' },
    h('div', { className: 'stars' }, [1, 2, 3, 4, 5].map((n) =>
      btn(n <= rating ? '★' : '☆', () => setRating(n), { key: n, 'aria-label': n + ' stars' }))),
    h('span', null, rating ? rating + ' of 5' : 'Not rated'))
}

function ProfileTabs() {
  const [tab, setTab] = useState('Posts')
  const text = { Posts: '12 posts', Photos: '48 photos', Friends: '230 friends' }
  return h('div', { className: 'col' },
    h('div', { className: 'tabs' }, Object.keys(text).map((t) =>
      btn(t, () => setTab(t), { key: t, className: t === tab ? 'on' : '' }))),
    h('span', null, text[tab]))
}

function PasswordBox() {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  return h('div', { className: 'col' },
    h('input', { type: show ? 'text' : 'password', value: password, placeholder: 'password', onChange: (e) => setPassword(e.target.value), 'aria-label': 'Password' }),
    h('label', null, h('input', { type: 'checkbox', checked: show, onChange: () => setShow(!show) }), ' Show password'))
}

function CartItem() {
  const [quantity, setQuantity] = useState(1)
  return h('div', { className: 'col' },
    h('span', null, '🧦 Socks · $12 each'),
    h('div', { className: 'row' }, btn('−', () => setQuantity((q) => Math.max(1, q - 1))), h('span', { className: 'big' }, quantity), btn('+', () => setQuantity((q) => q + 1))),
    h('span', null, 'Total: $' + quantity * 12))
}

function TrafficLight() {
  const [light, setLight] = useState('red')
  const next = { red: 'green', green: 'yellow', yellow: 'red' }
  return h('div', { className: 'row' },
    h('div', { className: 'lights' }, ['red', 'yellow', 'green'].map((c) => h('i', { key: c, className: c + (c === light ? ' on' : '') }))),
    btn('Next', () => setLight(next[light])))
}

function DiceRoller() {
  const [roll, setRoll] = useState(1)
  return h('div', { className: 'row' },
    h('span', { className: 'die' }, '⚀⚁⚂⚃⚄⚅'[roll - 1]),
    btn('Roll', () => setRoll(1 + Math.floor(Math.random() * 6))))
}

function FaqAccordion() {
  const [openQuestion, setOpenQuestion] = useState(null)
  const faq = [['Shipping?', '3–5 days.'], ['Returns?', '30 days.'], ['Gift wrap?', 'Yes, $2.']]
  return h('div', { className: 'col left' }, faq.map(([q, a], i) => h('div', { key: q },
    btn((openQuestion === i ? '▾ ' : '▸ ') + q, () => setOpenQuestion(openQuestion === i ? null : i), { className: 'link' }),
    openQuestion === i && h('div', { className: 'muted' }, a))))
}

function PostBox() {
  const [text, setText] = useState('')
  return h('div', { className: 'col' },
    h('textarea', { rows: 2, maxLength: 60, value: text, placeholder: 'What’s happening?', onChange: (e) => setText(e.target.value), 'aria-label': 'Post' }),
    h('span', { className: 'muted' }, 60 - text.length + ' characters left'))
}

function Thermostat() {
  const [celsius, setCelsius] = useState(20)
  const [unit, setUnit] = useState('C')
  const shown = unit === 'C' ? celsius : Math.round(celsius * 9 / 5 + 32)
  return h('div', { className: 'col' },
    h('div', { className: 'row' }, btn('−', () => setCelsius(celsius - 1)), h('span', { className: 'big' }, shown + '°' + unit), btn('+', () => setCelsius(celsius + 1))),
    btn('Show °' + (unit === 'C' ? 'F' : 'C'), () => setUnit(unit === 'C' ? 'F' : 'C')))
}

function DarkModeCard() {
  const [dark, setDark] = useState(false)
  return h('div', { className: 'col' },
    h('div', { className: 'preview' + (dark ? ' dark' : '') }, dark ? 'Night mode' : 'Day mode'),
    h('label', null, h('input', { type: 'checkbox', checked: dark, onChange: () => setDark(!dark) }), ' Dark mode'))
}

function Stopwatch() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  return h('div', { className: 'col' },
    h('span', { className: 'big' }, Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')),
    h('div', { className: 'row' }, btn(running ? 'Pause' : 'Start', () => setRunning(!running)), btn('Reset', () => setSeconds(0))))
}

function ShirtPicker() {
  const [size, setSize] = useState('M')
  const [color, setColor] = useState('navy')
  return h('div', { className: 'col' },
    h('svg', { viewBox: '0 0 64 64', width: 60, height: 60, 'aria-label': 'T-shirt' },
      h('path', { d: 'M22 6 L10 12 L2 26 L12 32 L16 27 L16 60 L48 60 L48 27 L52 32 L62 26 L54 12 L42 6 Q32 16 22 6 Z', fill: color, stroke: '#1b2230', strokeWidth: 2 })),
    h('div', { className: 'tabs' }, ['S', 'M', 'L'].map((s) => btn(s, () => setSize(s), { key: s, className: s === size ? 'on' : '' }))),
    h('div', { className: 'tabs' }, ['navy', 'crimson', 'seagreen'].map((c) => btn('', () => setColor(c), { key: c, className: 'swatch' + (c === color ? ' on' : ''), style: { background: c }, 'aria-label': c }))),
    h('span', { className: 'muted' }, 'Size ' + size))
}

function TodoItem() {
  const [done, setDone] = useState(false)
  return h('label', { className: done ? 'done' : '' },
    h('input', { type: 'checkbox', checked: done, onChange: () => setDone(!done) }), ' Buy milk')
}

function Notification() {
  const [visible, setVisible] = useState(true)
  return visible
    ? h('div', { className: 'note' }, h('span', null, '🔔 You have a new message'), btn('×', () => setVisible(false), { 'aria-label': 'Dismiss' }))
    : btn('Show the message again', () => setVisible(true), { className: 'link' })
}

function QuizQuestion() {
  const [choice, setChoice] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  return h('div', { className: 'col left' },
    h('b', null, '2 + 2 × 2 = ?'),
    ['6', '8'].map((o) => h('label', { key: o }, h('input', { type: 'radio', name: 'quiz', checked: choice === o, onChange: () => { setChoice(o); setSubmitted(false) } }), ' ' + o)),
    btn('Submit', () => setSubmitted(true), { disabled: !choice }),
    submitted && h('span', null, choice === '6' ? '✓ Correct' : '✗ Try again'))
}

function SeatPicker() {
  const [seats, setSeats] = useState([])
  const toggle = (s) => setSeats(seats.includes(s) ? seats.filter((x) => x !== s) : [...seats, s])
  return h('div', { className: 'col' },
    h('div', { className: 'seats' }, ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map((s) => btn(s, () => toggle(s), { key: s, className: seats.includes(s) ? 'on' : '' }))),
    h('span', null, seats.length + ' seats chosen'))
}

function MoodPicker() {
  const [mood, setMood] = useState('🙂')
  return h('div', { className: 'col' },
    h('span', { className: 'die' }, mood),
    h('div', { className: 'tabs' }, ['😀', '🙂', '😐', '😴', '😡'].map((m) => btn(m, () => setMood(m), { key: m, className: m === mood ? 'on' : '' }))))
}

function CoinFlip() {
  const [side, setSide] = useState('Heads')
  const [flips, setFlips] = useState(0)
  return h('div', { className: 'col' },
    h('span', { className: 'big' }, '🪙 ' + side),
    btn('Flip', () => { setSide(Math.random() < 0.5 ? 'Heads' : 'Tails'); setFlips(flips + 1) }),
    h('span', { className: 'muted' }, 'Flips: ' + flips))
}

function TextSize() {
  const [fontSize, setFontSize] = useState(16)
  return h('div', { className: 'col' },
    h('div', { className: 'row' }, btn('A−', () => setFontSize(Math.max(10, fontSize - 2))), btn('A+', () => setFontSize(Math.min(30, fontSize + 2)))),
    h('span', { style: { fontSize } }, 'Read me'))
}

function PaintPicker() {
  const [paint, setPaint] = useState('#2552c9')
  return h('div', { className: 'col' },
    h('div', { className: 'paint', style: { background: paint } }),
    h('div', { className: 'tabs' }, ['#2552c9', '#d64545', '#f2b600', '#13795b'].map((c) => btn('', () => setPaint(c), { key: c, className: 'swatch' + (c === paint ? ' on' : ''), style: { background: c }, 'aria-label': c }))))
}

function Pagination() {
  const [page, setPage] = useState(1)
  return h('div', { className: 'row' },
    btn('‹', () => setPage(page - 1), { disabled: page === 1, 'aria-label': 'Previous page' }),
    h('span', null, 'Page ' + page + ' of 5'),
    btn('›', () => setPage(page + 1), { disabled: page === 5, 'aria-label': 'Next page' }))
}

function FruitSearch() {
  const [query, setQuery] = useState('')
  const fruit = ['apple', 'banana', 'cherry', 'grape', 'mango', 'pear']
  const matches = fruit.filter((f) => f.includes(query.toLowerCase()))
  return h('div', { className: 'col' },
    h('input', { value: query, placeholder: 'search fruit', onChange: (e) => setQuery(e.target.value), 'aria-label': 'Search fruit' }),
    h('span', { className: 'muted' }, matches.join(', ') || 'no fruit'))
}

function PizzaBuilder() {
  const [toppings, setToppings] = useState([])
  const all = ['cheese', 'mushroom', 'olive']
  const toggle = (t) => setToppings(toppings.includes(t) ? toppings.filter((x) => x !== t) : [...toppings, t])
  return h('div', { className: 'col left' },
    all.map((t) => h('label', { key: t }, h('input', { type: 'checkbox', checked: toppings.includes(t), onChange: () => toggle(t) }), ' ' + t)),
    h('b', null, 'Price: $' + (10 + toppings.length * 2)))
}

function SignupSteps() {
  const [step, setStep] = useState(1)
  const names = ['Account', 'Profile', 'Done']
  return h('div', { className: 'col' },
    h('div', { className: 'steps' }, names.map((n, i) => h('span', { key: n, className: i + 1 === step ? 'on' : '' }, i + 1 + ' ' + n))),
    h('div', { className: 'row' }, btn('Back', () => setStep(step - 1), { disabled: step === 1 }), btn('Next', () => setStep(step + 1), { disabled: step === 3 })))
}

function MusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const [song, setSong] = useState(0)
  const songs = ['Lo-fi Beats', 'Sea Shanty', 'Moonlight']
  return h('div', { className: 'col' },
    h('span', null, (playing ? '🎵 Playing: ' : 'Paused: ') + songs[song]),
    h('div', { className: 'row' },
      btn('⏮', () => setSong((song + 2) % 3), { 'aria-label': 'Previous song' }),
      btn(playing ? '⏸' : '▶', () => setPlaying(!playing), { 'aria-label': playing ? 'Pause' : 'Play' }),
      btn('⏭', () => setSong((song + 1) % 3), { 'aria-label': 'Next song' })))
}

function TipCalculator() {
  const [bill, setBill] = useState(40)
  const [tipPercent, setTipPercent] = useState(15)
  const tip = (bill * tipPercent) / 100
  return h('div', { className: 'col' },
    h('label', null, 'Bill $', h('input', { type: 'number', min: 0, value: bill, onChange: (e) => setBill(Number(e.target.value)), className: 'num', 'aria-label': 'Bill' })),
    h('div', { className: 'tabs' }, [10, 15, 20].map((p) => btn(p + '%', () => setTipPercent(p), { key: p, className: p === tipPercent ? 'on' : '' }))),
    h('span', null, 'Tip $' + tip.toFixed(2) + ' · Total $' + (bill + tip).toFixed(2)))
}

// state: what a student should say (plain words). notState: things on screen that change but are
// worked out from the state, so they are not state themselves.
export const BOXES = [
  { title: 'Light switch', C: LightSwitch, state: ['Is the light on or off?'] },
  { title: 'Counter', C: Counter, state: ['The number'] },
  { title: 'Volume slider', C: VolumeSlider, state: ['The volume the slider is set to'] },
  { title: 'Like button', C: LikeButton, state: ['Did I like it, yes or no?'], notState: ['The number of likes: it is 41, plus 1 when liked'] },
  { title: 'Star rating', C: StarRating, state: ['How many stars are picked'] },
  { title: 'Profile tabs', C: ProfileTabs, state: ['Which tab is open'] },
  { title: 'Password box', C: PasswordBox, state: ['The password typed so far', 'Show the password, yes or no?'] },
  { title: 'Cart item', C: CartItem, state: ['How many (the quantity)'], notState: ['The total: quantity × $12'] },
  { title: 'Traffic light', C: TrafficLight, state: ['Which light is lit'] },
  { title: 'Dice', C: DiceRoller, state: ['The number rolled'] },
  { title: 'FAQ', C: FaqAccordion, state: ['Which question is open (or none)'] },
  { title: 'Post box', C: PostBox, state: ['The text typed so far'], notState: ['Characters left: 60 minus the length of the text'] },
  { title: 'Thermostat', C: Thermostat, state: ['The temperature', '°C or °F'], notState: ['The °F number: worked out from the °C one'] },
  { title: 'Dark mode', C: DarkModeCard, state: ['Dark mode on or off'] },
  { title: 'Stopwatch', C: Stopwatch, state: ['The seconds so far', 'Running or paused'] },
  { title: 'T-shirt', C: ShirtPicker, state: ['The size', 'The colour'] },
  { title: 'To-do item', C: TodoItem, state: ['Done or not done'] },
  { title: 'Notification', C: Notification, state: ['Is the message showing or dismissed?'] },
  { title: 'Quiz', C: QuizQuestion, state: ['The answer picked', 'Submitted yet, yes or no?'], notState: ['“Correct” or “Try again”: worked out from the answer'] },
  { title: 'Cinema seats', C: SeatPicker, state: ['The list of seats chosen'], notState: ['“2 seats chosen”: the length of the list'] },
  { title: 'Mood', C: MoodPicker, state: ['The mood picked'] },
  { title: 'Coin flip', C: CoinFlip, state: ['Heads or tails', 'How many flips'] },
  { title: 'Text size', C: TextSize, state: ['The font size'] },
  { title: 'Paint colour', C: PaintPicker, state: ['The colour picked'] },
  { title: 'Pages', C: Pagination, state: ['The page we are on'] },
  { title: 'Fruit search', C: FruitSearch, state: ['The search text'], notState: ['The fruit shown: the list filtered by the text'] },
  { title: 'Pizza', C: PizzaBuilder, state: ['The list of toppings picked'], notState: ['The price: $10 + $2 per topping'] },
  { title: 'Sign-up steps', C: SignupSteps, state: ['Which step we are on'] },
  { title: 'Music player', C: MusicPlayer, state: ['Playing or paused', 'Which song'] },
  { title: 'Tip calculator', C: TipCalculator, state: ['The bill amount', 'The tip % picked'], notState: ['The tip and the total: worked out from those two'] },
]

// The useState lines of a component, read from its own source code.
export const useStateLines = (C) => C.toString().match(/const \[\w+, \w+\] = useState\(.*?\)(?=\n)/g) || []
