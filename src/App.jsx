import { useEffect, useMemo, useState } from 'react'
import places from './data/places.json'

const CATEGORIES = {
  palaces: { label: 'Palaces & History', icon: '🏯' },
  temples: { label: 'Temples', icon: '🛕' },
  nature: { label: 'Nature & Beaches', icon: '🌊' },
  food: { label: 'Food & Markets', icon: '🍜' },
  shopping: { label: 'Shopping', icon: '🛍️' },
  culture: { label: 'Culture & Modern', icon: '🎨' },
}
const CITIES = ['All', 'Seoul', 'Busan']
const STORAGE_KEY = 'sb-guide-favourites'

function loadFavourites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [])
  } catch {
    return new Set()
  }
}

const naverUrl = (p) => `https://map.naver.com/p/search/${encodeURIComponent(p.korean)}`
const googleUrl = (p) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name}, ${p.city}, South Korea`)}`

function Photo({ place }) {
  const [failed, setFailed] = useState(false)
  const { icon } = CATEGORIES[place.category]
  if (!place.photo || failed) {
    return (
      <div className={`photo fallback cat-${place.category}`} aria-hidden="true">
        <span>{icon}</span>
      </div>
    )
  }
  return (
    <figure className="photo">
      <img src={place.photo.src} alt={place.name} loading="lazy" onError={() => setFailed(true)} />
      <figcaption>
        <a href={place.photo.sourceUrl} target="_blank" rel="noreferrer">
          📷 {place.photo.credit} · {place.photo.license}
        </a>
      </figcaption>
    </figure>
  )
}

function PlaceCard({ place, saved, onToggle }) {
  const cat = CATEGORIES[place.category]
  return (
    <article className="card">
      <Photo place={place} />
      <button
        className={`fav ${saved ? 'on' : ''}`}
        onClick={() => onToggle(place.id)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${place.name} from My list` : `Add ${place.name} to My list`}
      >
        {saved ? '♥' : '♡'}
      </button>
      <div className="body">
        <div className="tags">
          <span className={`tag cat-${place.category}`}>
            {cat.icon} {cat.label}
          </span>
          <span className="tag city">{place.city}</span>
        </div>
        <h2>
          {place.name} <span className="ko" lang="ko">{place.korean}</span>
        </h2>
        <p className="desc">{place.description}</p>
        <dl>
          <dt>🗓️ Best time</dt>
          <dd>{place.bestTime}</dd>
          <dt>🚇 Getting there</dt>
          <dd>{place.transport}</dd>
        </dl>
        <div className="maps">
          <a className="btn naver" href={naverUrl(place)} target="_blank" rel="noreferrer">
            Naver Map
          </a>
          <a className="btn google" href={googleUrl(place)} target="_blank" rel="noreferrer">
            Google Maps
          </a>
        </div>
      </div>
    </article>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('All')
  const [category, setCategory] = useState(null)
  const [onlySaved, setOnlySaved] = useState(false)
  const [favourites, setFavourites] = useState(loadFavourites)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favourites]))
    } catch {
      // Storage unavailable (private mode); favourites last for this visit only.
    }
  }, [favourites])

  const toggleFavourite = (id) =>
    setFavourites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return places.filter(
      (p) =>
        (city === 'All' || p.city === city) &&
        (!category || p.category === category) &&
        (!onlySaved || favourites.has(p.id)) &&
        (!q || [p.name, p.korean, p.description, p.transport].some((f) => f.toLowerCase().includes(q))),
    )
  }, [query, city, category, onlySaved, favourites])

  const reset = () => {
    setQuery('')
    setCity('All')
    setCategory(null)
    setOnlySaved(false)
  }

  return (
    <>
      <header className="hero">
        <p className="eyebrow">서울 · 부산 여행 가이드</p>
        <h1>Seoul &amp; Busan Travel Guide</h1>
        <p className="lede">
          {places.length} must-visit places with the best time to go, the nearest subway exit, and one-tap Naver Map
          &amp; Google Maps links. Tip: Naver Map gives much better directions inside Korea.
        </p>
      </header>

      <main>
        <section className="controls" aria-label="Filters">
          <input
            type="search"
            placeholder="Search places, food, subway stations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search places"
          />
          <div className="row">
            <div className="segmented" role="group" aria-label="City">
              {CITIES.map((c) => (
                <button key={c} className={city === c ? 'active' : ''} onClick={() => setCity(c)}>
                  {c}
                </button>
              ))}
            </div>
            <button className={`chip saved ${onlySaved ? 'active' : ''}`} onClick={() => setOnlySaved((v) => !v)}>
              ♥ My list ({favourites.size})
            </button>
          </div>
          <div className="chips" role="group" aria-label="Category">
            <button className={`chip ${!category ? 'active' : ''}`} onClick={() => setCategory(null)}>
              All types
            </button>
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <button
                key={key}
                className={`chip cat-${key} ${category === key ? 'active' : ''}`}
                onClick={() => setCategory(category === key ? null : key)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </section>

        <p className="count">
          Showing {results.length} of {places.length} places
        </p>

        {results.length ? (
          <section className="grid">
            {results.map((p) => (
              <PlaceCard key={p.id} place={p} saved={favourites.has(p.id)} onToggle={toggleFavourite} />
            ))}
          </section>
        ) : (
          <div className="empty">
            <p>{onlySaved && !favourites.size ? 'Your list is empty. Tap ♡ on a place to save it.' : 'No places match.'}</p>
            <button className="chip" onClick={reset}>
              Clear filters
            </button>
          </div>
        )}
      </main>

      <footer>
        Photos from Wikimedia Commons, credited on each card. Opening hours change, so check before you go.
      </footer>
    </>
  )
}
