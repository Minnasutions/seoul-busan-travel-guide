// Looks up each place's Wikipedia lead image, keeps it only if it is hosted on
// Wikimedia Commons (freely licensed), and writes photo + credit into places.json.
import { readFile, writeFile } from 'node:fs/promises'

const UA = { 'User-Agent': 'seoul-busan-travel-guide/1.0 (https://github.com/Minnasutions/seoul-busan-travel-guide)' }
const base = JSON.parse(await readFile(new URL('../src/data/places.base.json', import.meta.url), 'utf8'))

const stripHtml = (s = '') => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

async function photoFor(wiki) {
  const summary = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wiki)}`, { headers: UA })
  if (!summary.ok) return null
  const { originalimage } = await summary.json()
  if (!originalimage) return null
  // Either .../commons/a/ab/File.jpg or .../commons/thumb/a/ab/File.jpg/3840px-File.jpg
  const parts = new URL(originalimage.source).pathname.split('/')
  const file = decodeURIComponent(parts.includes('thumb') ? parts.at(-2) : parts.at(-1))

  const params = new URLSearchParams({
    action: 'query', format: 'json', titles: `File:${file}`,
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '960',
  })
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: UA })
  const page = Object.values((await res.json()).query.pages)[0]
  const info = page.imageinfo?.[0]
  if (page.missing !== undefined || !info) return null // local, non-free file

  const meta = info.extmetadata
  return {
    src: info.thumburl,
    credit: stripHtml(meta.Artist?.value) || 'Unknown author',
    license: meta.LicenseShortName?.value || 'See source',
    sourceUrl: info.descriptionurl,
  }
}

const out = []
for (const place of base) {
  const photo = await photoFor(place.wiki).catch(() => null)
  console.log(photo ? 'ok     ' : 'MISSING', place.id, photo?.license ?? '')
  out.push({ ...place, photo })
}
await writeFile(new URL('../src/data/places.json', import.meta.url), JSON.stringify(out, null, 2) + '\n')
