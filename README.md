# Seoul & Busan Travel Guide

A quick reference of 33 must-visit places in Seoul and Busan: best time to visit, nearest subway exit, and one-tap Naver Map / Google Maps links. Search, filter by city and category, and save favourites to "My list" (stored in your browser).

Built with Vite + React and deployed on Vercel.

## Develop

```bash
npm install
npm run dev
```

## Edit places

Places live in `src/data/places.base.json`. After adding or changing a place, refresh photos and credits from Wikimedia Commons:

```bash
npm run photos
```

This writes `src/data/places.json`, which the site reads. Places without a freely licensed photo show a coloured category icon instead.
