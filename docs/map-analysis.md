# RV Overnights — map.js Analysis and Performance Recommendations

Date: 2025-10-03

## Purpose
This document analyzes `map.js` (used inside a Bubble app) that loads and renders host locations on a Mapbox GL JS map. It covers what the code does, its caching behavior, performance characteristics (including a scenario with ~70,000 records), effects of slow networks, and practical recommendations to improve speed and resilience.

---

## High-level summary of what the code does
- Initializes a Mapbox map with dynamic style, center, and zoom.
- On `map.load` it:
  - Enables weather/overlay layers,
  - Initializes an empty GeoJSON source + symbol layer for locations,
  - Triggers a global fetch of all host locations via `fetchDataAndProcess`.
- `fetchDataAndProcess` builds a POST request body containing filters and intentionally overrides bounds/zoom to fetch a global dataset (all records), then calls `fetchDataWithRetry`.
- `fetchDataWithRetry` posts to a Xano API endpoint with basic retry (3 attempts, increasing delay).
- The response is stored in `allMarkersData` and `dataLoaded` is set.
- `preloadImagesAndAddData` extracts unique category icon URLs, loads them into the Mapbox style (`map.loadImage` → `map.addImage`) with per-image and global timeouts (3s per image, 8s overall). After images settle (or timeouts), `addMarkers` converts the dataset into a GeoJSON FeatureCollection and sets it as the `locationsSource` data.
- Interaction:
  - Clicking a symbol on mobile calls a Bubble callback.
  - Clicking on desktop shows a rich HTML popup (image + metadata).
- Overlays implemented:
  - Weather (OpenWeather raster tiles),
  - Air quality (Google raster tiles),
  - Wildfires (CSV from FIRMS → GeoJSON),
  - DarkSkies (switching map style and re-adding a raster tileset).
- There is a client-side "surface filter" (`surfaceFilteredLocationIDs`) that can filter the already-loaded `allMarkersData` without a network call.

---

## Caching behavior
- In-memory caching:
  - `allMarkersData` retains the last-fetched dataset during the page session. This allows re-rendering and client-side filtering (surface filter) without re-fetching.
- Mapbox image caching:
  - Images added with `map.addImage` remain until a style change. However, changing the style (e.g., DarkSkies) resets the style and clears images. The code does not reliably re-run the image preloading step after style changes (it calls `addMarkers`), so icons can be missing after toggling style.
- No persistent browser cache:
  - No IndexedDB / localStorage caching of markers or fetched data across sessions.
- No HTTP-level cache handling:
  - The client does not make use of ETags, conditional requests, or server-side cached tiles.

## Client-side storage options (beyond sessionStorage) and recommendation

Short summary
- sessionStorage/localStorage are synchronous, limited in size (~5–10 MB typical), and block the main thread on large reads/writes — not suitable for caching large geo datasets (tens of thousands of records).
- Use IndexedDB (asynchronous, non-blocking, large storage) and/or the Cache Storage API (for HTTP responses, tiles, images) for durable, performant client-side caching.
- Combine an in-memory cache (fast for current session) with IndexedDB/Cache Storage for persistence and offline-friendly behavior. Cache per-tile / per-bbox rather than storing an entire dataset at once.

Why not sessionStorage/localStorage
- Capacity limits: large datasets (70k records) will likely exceed browser limits.
- Synchronous API: JSON.stringify/parse on large payloads blocks the main thread and causes UI jank.
- Per-tab lifetime: sessionStorage is cleared when the tab closes; not ideal for multi-session caching.

Recommended approach (practical)
1. Key-by-tile / bbox + filter signature
   - Store cached entries by tile key or a rounded bbox + zoom + filter signature (e.g., `z/x/y:filtersHash`).
   - Cache only minimal properties needed to render points (lon, lat, id, icon URL, small label). Defer heavy fields to on-demand fetches when a popup opens.
2. Storage choices
   - IndexedDB: primary store for JSON payloads (tiles / small feature arrays). Use small helper libraries (idb, localForage, dexie) to simplify usage.
   - Cache Storage (Service Worker): ideal for caching network Response objects (tiles, images, raster layers) and for offline/fast replays.
   - In-memory: keep the recently used tiles/feature arrays in a fast JS object for instant access while the tab is alive.
3. Read-through caching pattern
   - On viewport change: compute required tile keys.
   - For each tile key: check IndexedDB; if cached and fresh → use it; otherwise fetch from server, store in IndexedDB, then render.
4. Eviction and TTL
   - Implement TTL (e.g., 10–60 minutes) per cached entry and a simple LRU or max-size eviction to avoid unbounded growth.
5. Avoid caching the entire 70k blob
   - Caching the whole dataset moves cost from network to parse and memory. Better to cache small, viewport-sized chunks.

Illustrative code snippets (lightweight)

a) IndexedDB via idb-keyval (example)
```js
// Assumes idb-keyval is available
import { get, set } from 'idb-keyval';

const makeKey = (z, bbox, filters) => {
  const sig = JSON.stringify(filters); // or a hash of filters
  const box = [Math.round(bbox.minX), Math.round(bbox.minY), Math.round(bbox.maxX), Math.round(bbox.maxY)].join('_');
  return `tile:${z}:${box}:${sig}`;
};

async function getCachedTile(key) {
  return await get(key); // returns value or undefined
}

async function setCachedTile(key, data) {
  await set(key, { ts: Date.now(), data });
}
```

b) Read-through flow (pseudo)
```js
async function fetchViewportData(bbox, zoom, filters) {
  const key = makeKey(zoom, bbox, filters);
  const cached = await getCachedTile(key);
  if (cached && (Date.now() - cached.ts) < TTL_MS) {
    return cached.data;
  }
  const resp = await fetch('/api/locations?bbox=...&zoom=...&filters=...');
  const data = await resp.json();
  await setCachedTile(key, data);
  return data;
}
```

c) Cache Storage for HTTP responses (service worker)
- Use Cache Storage to intercept API/tile requests and serve cached Response objects when available; fallback to network otherwise. This reduces duplicate network load for identical tile URLs.

Tradeoffs and implementation notes
- IndexedDB requires async code; prefer helper libraries to reduce boilerplate.
- Cache Storage works best when requests are deterministic (tile URLs, stable URL params).
- Staleness: include a TTL and implement background revalidation to keep cached tiles reasonably fresh.
- Privacy: avoid storing sensitive PII client-side for long durations.

Where caching helps most
- Panning back to recently visited areas (near-instant rendering).
- Repeated toggles of overlays or UI interactions that would otherwise re-request the same data.
- Users with intermittent connectivity (offline fallback to cached tiles).

Where caching doesn’t solve the core problem
- Initial first-time load for an uncached area will still require network transfer and parsing. The primary scalability solution is still to restrict payloads (viewport/tile fetching, clustering, or vector tiles) rather than rely solely on caching.

Recommendation
- Implement a tile/bbox-based cache backed by IndexedDB and Cache Storage, with an in-memory fast index for the current session. Combine this with viewport-based fetching and clustering for the best overall performance.


---

## Performance analysis (including 70,000 points)
Primary performance costs:
1. Network: Fetching "all" points in one request (the script intentionally requests global bounds) means the payload is likely large. For 70k records this will be multi-megabyte JSON even when compressed.
2. Parsing: JSON.parse of a large payload is synchronous and happens on the main thread — it will block UI during parse.
3. Mapbox ingestion: `map.getSource(...).setData(featureCollection)` triggers geojson-vt tiling, indexing, and symbol placement. This can be CPU- and memory-intensive for tens of thousands of points.
4. Rendering: Displaying tens of thousands of symbols increases GPU/fragment and draw-call work; map interactions (pan/zoom) will become janky on lower-end devices.

Will 70,000 records be slow?
- Very likely yes:
  - Initial network download will dominate on slow links.
  - Browser main-thread will spend time parsing and preparing the GeoJSON.
  - Mapbox GL will struggle to place/render 70k unclustered symbols smoothly, especially on mobile or older devices.
- If unique icon count is low (few category icons), image loading will not be the major bottleneck — the number of features is.

Examples of likely symptoms:
- Long loading spinner (seconds to minutes depending on bandwidth).
- Temporary UI freeze while parsing or when setData is called.
- Choppy panning and zooming; high memory usage.

---

## Effect of slow internet
- Data fetch latency increases linearly with payload size; on very slow networks the initial load may time out or take many seconds/minutes.
- No abort or explicit fetch timeout means a request can hang (the code retries, but each attempt waits for native fetch resolution).
- Additional requests (OpenWeather tiles, Google air quality tiles, FIRMS CSV, and individual icon images) add pressure and compete for bandwidth.
- UI impact:
  - Loading indicator stays visible (good UX element), but the user may wait a long time without meaningful progress.
  - If icon images fail to load (timeouts present), markers still appear (icons may be missing).

---

## Key issues / minor bugs observed
- Style changes (dark/normal) will remove previously added images; code re-adds layers but does not reliably re-run image preloads → icons may disappear.
- `movestart` listener is registered twice (duplicate).
- `showAirQuality` is declared twice.
- `addMarker` and `clickedMarker` are unused.
- The code forces global bounds for every fetch (explicitly overriding map bounds), causing full data downloads on any filter change.
- No AbortController / fetch timeout on the main data fetch.
- Filtering uses `array.includes` on allowed IDs — O(N) per check — use a Set for large lists.

---

## Data source (Xano vs Bubble DB) and Bubble plugin considerations

This section answers your questions about whether moving data retrieval from Xano to Bubble DB would improve performance, whether a Bubble map plugin could help with high-volume data, and what to ask plugin creators to verify capability.

1) Will changing retrieval from Xano to Bubble DB improve performance?
- Short answer: Not necessarily; performance depends on where and how server-side work is done, not just which product holds the rows.
- Key factors that determine perceived performance:
  - Latency between client and API: If Xano's endpoint is physically far from your users or hosted with high latency, then moving to a backend closer to your Bubble app (or using Bubble's built-in endpoints) could reduce round-trip time slightly. However, typical gains are modest unless the current latency is large.
  - Payload size & server-side filtering: The single biggest performance cost for large datasets (70k rows) is transferring and parsing the data. Whether the data comes from Xano or Bubble DB, sending 70k full records to the client will be slow. The crucial improvement is to perform server-side filtering/tiling/paging so the client only receives a small subset (viewport, tile, or aggregated clusters).
  - API / response tuning: Xano may offer more fine-grained control (compression headers, custom SQL, tile endpoints, vector-tiles generation) than Bubble's built-in data APIs. If Xano is already configured to serve tightly-packed, compressed, and filtered payloads, it can be faster than a generic Bubble DB response.
  - Concurrency and rate limits: Bubble's data API has operational constraints and may impose rate limits or slower throughput compared to a dedicated backend.
- Practical conclusion:
  - Moving to Bubble DB alone will not "drastically" improve performance for very large datasets. The correct approach is to change how data is served (viewport-based queries, clustering/aggregation, vector tiles), irrespective of the storage engine.
  - If Xano is slow or cannot implement server-side optimizations you need, migrating to Bubble (or another backend) might be worthwhile — but only if that move allows efficient server-side behavior (e.g., building tiles, pagination, or server-driven clustering).

2) Will using a Bubble map plugin improve performance for high-volume data?
- It depends heavily on the plugin:
  - Many Bubble map plugins are wrappers around existing mapping libraries (Mapbox, Leaflet, Google Maps). If a plugin exposes features like client-side clustering, vector tiles, or using a vector tile source, it can help.
  - Plugins that only accept a large GeoJSON blob and render it directly will likely suffer the same performance issues as your custom Mapbox code when fed 70k features.
  - Plugins that provide server-assisted features (tiling, lazy-loading, server-side clustering) or integrate with Mapbox vector tiles will offer the best performance.
- Likelihood of plugin support:
  - Generic/simple plugins: unlikely to handle tens of thousands of client-side markers smoothly.
  - Advanced plugins (explicitly advertise clustering, virtualized rendering, or vector tiles): more likely to meet your needs.
- When a plugin can help:
  - If it supports vector tile sources (hosted MBTiles or Mapbox tileset) or automatic viewport-based fetching + clustering, it can significantly improve UX without major custom work.

3) If we don't know, what questions should we ask a plugin creator?
- Use this checklist when evaluating map plugins or speaking with plugin authors:
  - Data volume & performance
    - "Have you tested this plugin with X (e.g., 10k / 50k / 70k) features? What was the user experience (memory, frame rate, load time)?"
    - "What is the recommended maximum number of features sent to the client at once?"
  - Data sources & tiling
    - "Does the plugin support vector tile sources (Mapbox vector tiles / custom tile server / MBTiles)?"
    - "Can the plugin connect to custom tile endpoints or accept a tileset URL (mapbox:// or https://tileserver/{z}/{x}/{y}.pbf)?"
  - Clustering & aggregation
    - "Does the plugin support client-side clustering? If so, can we configure cluster radius, max zoom for clustering, and cluster styling?"
    - "Does it support server-side clustering or pre-aggregated clusters?"
  - Lazy-loading / viewport fetching
    - "Can the plugin request only data for the visible map bounds (and with padding) and fetch more as the user pans/zooms?"
    - "Does the plugin expose hooks or events for moveend/movestart to trigger custom fetch logic?"
  - Caching & offline behavior
    - "Does the plugin maintain an internal cache of tiles/data to avoid re-fetching the same area? Can we customize the cache key (filter signature + bbox)?"
    - "Does it provide any persistent caching (IndexedDB) or only in-memory?"
  - Styling & icons
    - "How does the plugin manage custom icons and style changes? Does it re-add images automatically after style changes, or do we need to handle that?"
  - Extensibility & integration
    - "Can we intercept click events to fetch per-marker details on demand (i.e., lazy-loading popups)?"
    - "Can the plugin work with web workers for preprocessing/filtering?"
  - Failures & timeouts
    - "Does the plugin support request cancellation (AbortController) or handling of long-running fetches?"
    - "How does it behave if tile/data requests fail or timeout?"
  - Documentation & examples
    - "Do you have examples or case studies showing this plugin handling high-volume datasets or vector tiles?"
    - "Can you provide a sample implementation that uses viewport-based requests and clustering?"
  - Licensing & hosting considerations
    - "Are there any licensing limits for high-volume usage (Mapbox token requirements, billing)?"
    - "Does the plugin require a paid plan for advanced features?"

4) Practical guidance / recommended next steps
- Prioritize changing how data is delivered before changing where it’s stored:
  - Implement viewport-based fetching, server-side clustering, or vector tiles (these will yield the biggest performance gains).
- Evaluate plugins only after confirming they support either:
  - Vector tiles (best), or
  - Efficient viewport-based loading + clustering + caching.
- If you are considering migration to Bubble DB primarily for performance, benchmark typical request latency and whether Bubble can implement the necessary server-side endpoints (e.g., an API workflow that returns tile-bounded results). If Bubble can do this but Xano cannot, migration may make sense.
- If keeping Xano, explore building server-side endpoints that:
  - Return only minimal feature properties for the viewport,
  - Support pagination or tile-based responses,
  - Optionally produce vector tiles for direct Mapbox consumption.

---

## Filters: impact on design and implementation

Many filters increase complexity because they change the shape of queries, cache keys, and the amount of data that must be returned or aggregated. Treat filters as a first-class part of the data delivery design — not as UI-only controls. Key implications and recommended practices:

1) Server-side vs client-side filtering
- Always prefer server-side filtering for large datasets. Sending the entire dataset to the client and filtering there does not scale.
- Server APIs should accept a bounded bbox/zoom plus filter parameters and return only the minimal properties needed for map rendering.
- For very dynamic or ad-hoc filter combinations, consider supporting on-demand detail fetches (popup-level data) while keeping the map layer payload minimal.

2) Cache key and cache design
- Every change in filters changes the data universe — include a normalized filter signature in any cache key.
  - Example key: `tile:z/x/y:filtersHash`.
- Normalize filters (sort lists, remove defaults) before hashing so functionally equivalent filter sets produce the same key.
- Avoid producing cache entries for rarely-used filter combinations (cache only on demand) and evict old entries.

3) Combinatorial explosion and precomputation
- With many independent filters, possible combinations can grow exponentially. Two mitigation patterns:
  - Precompute tiles (vector tiles or aggregated tiles) only for a small set of common filter presets (popular combinations).
  - Use on-the-fly tile generation with caching for uncommon combinations (generate + store when first requested).
- Consider denormalized tables or materialized views (on server) for filters that are expensive to compute repeatedly (e.g., geospatial joins, availability calculations).

4) Indexing and query planning (server-side)
- Ensure server queries are indexed for the attributes commonly used in filters (spatial indexes for bbox queries, composite indexes for multi-column filters).
- Use database explain plans to detect slow combinations and add targeted indexes (avoid blind full-table scans).

5) Progressive & incremental fetches
- Implement progressive loading: initial lightweight request returns points aggregated or clustered; then refine with subsequent requests as the user zooms or applies more specific filters.
- Allow "Apply filters" vs. "Live filter" modes in the UI: many filters should be applied after the user confirms to avoid frequent full-data re-requests.

6) UX considerations
- Debounce filter changes (250–700ms) or require explicit apply for expensive filters.
- Show which filters materially change the result set (e.g., show an estimated count) before fetching.
- Disable or warn when a filter combination is likely to return a very large result set.
- Make heavy filters (date-range, full-text search) optional or apply them in a second step (list view) rather than on the map by default.

7) Client-side responsibilities
- Keep the map payload minimal; offload heavy operations to server (aggregation, availability checks).
- Use a consistent filter normalization function on the client to compute cache keys that match server cache keys.
- If supporting client-side surface filtering (like existing surfaceFilteredLocationIDs), treat that as a secondary refinement on top of a server-provided minimal result.

8) Clustering and filtering interaction
- Clustering must reflect active filters. Either:
  - Cluster on the server per-filter (pre-aggregated clusters or cluster tiles), or
  - Send raw viewport points for clustering client-side (works only for moderate counts), or
  - Use vector tiles where features are generalized per zoom level and reflect filters.
- When filters change, update clustering data accordingly (invalidate cluster cache for affected tiles).

9) Monitoring and telemetry
- Log filter usage and slow queries to identify the most common and most expensive combinations — prioritize optimizations for those.
- Track cache hit/miss rates per filter signature to tune TTLs and cache strategies.

10) Practical checklist for implementation
- [ ] Define canonical filter normalization and hashing function.
- [ ] Update server endpoints to accept bbox + filters and return minimal properties.
- [ ] Include filter signature in cache keys (server + client).
- [ ] Add indexes/materialized views for expensive filter attributes.
- [ ] Implement debounce/apply UX for expensive filters.
- [ ] Add telemetry for filter usage and slow queries.
- [ ] Ensure clustering/tiles reflect filters (server-side clusters or filter-aware tiles).

Summary
- Filters increase the dimensionality of your queries and directly affect caching, tiling, and clustering strategies. The safest approach is to: (1) push filtering to the server, (2) normalize filter signatures and include them in cache keys, (3) precompute or cache common filter combinations, and (4) limit UI-driven live re-requests with debouncing or an explicit apply action. These patterns keep network payloads small, caches effective, and map performance predictable.

---

## Service workers and category-level rendering

Short answer
- Yes — service workers can improve perceived performance when combined with server-side support and client-side Web Workers. However, service workers alone cannot "render" map layers (they have no DOM access). Their role is to act as a network proxy/cache and to prefetch, cache, and serve category- or tile-specific responses quickly. Off-main-thread parsing and preparation of GeoJSON for Mapbox should be done in Web Workers, while Service Workers reliably cache/serve category-specific network responses.

How service workers help (roles)
1. Cache & serve category-specific tile/JSON responses
   - Expose category-aware endpoints (e.g., /tiles/{z}/{x}/{y}?category=camping) and let the service worker cache responses per URL (Cache Storage). The client requests category-specific tiles and the service worker returns cached data instantly if present.
2. Prefetching & background fetch
   - Use the service worker to prefetch tiles for neighboring tiles or commonly used categories when connection is good, so the client sees near-instant results when switching categories.
3. Offline & resilience
   - For intermittent or slow networks the service worker can serve cached category tiles, reducing network latency and improving UX.
4. Reduce duplicate network requests
   - Service worker + Cache Storage deduplicates identical requests (same URL + query) across tabs and retries, improving efficiency.
5. Granular cache keys
   - By encoding category + filters in the tile URL or request headers, the service worker can maintain fine-grained cache entries per category-filter combination.

What service workers cannot do
- They cannot access or manipulate the DOM or directly render map layers.
- They cannot perform heavy CPU work on behalf of the main thread (use Web Workers for parsing/filtering).
- They cannot replace the need for server-side filtering/tiling if you expect low payloads — service workers cache and serve, they don't magically reduce the original payload size.

Recommended architecture for category-level optimization
1. Server endpoints
   - Provide tile or bbox endpoints that accept category and filter parameters. Prefer vector tiles (pbf) if possible; otherwise compact JSON per tile is acceptable.
   - Make URLs deterministic so Cache Storage works well (e.g., /api/tiles/z/x/y/category/{slug}?filters=hash).
2. Service worker responsibilities
   - Intercept tile/JSON requests and:
     - Serve cached responses when available and fresh.
     - If missing, fetch from network, cache the response, and forward to client.
     - Optionally use stale-while-revalidate: return cached response immediately and refresh in background.
   - Prefetch strategy: when user views a tile, enqueue neighboring tiles (and same tiles for other active categories) for background fetch.
3. Client responsibilities
   - Request category-specific tiles/JSON via deterministic URLs.
   - Use a Web Worker to parse large JSON responses (or PBF decoding for vector tiles) and to build GeoJSON features off the main thread, then send results to the main thread.
   - Render the processed features into a Mapbox source (setData) on the main thread. Keep the data minimal for rendering.
4. Web Worker responsibilities
   - Receive raw responses (or ArrayBuffers if using vector tiles),
   - Decode/parse and filter features for the current viewport,
   - Transfer typed arrays or lightweight objects back to main thread via postMessage (use transferable objects where possible).
   - Optionally perform per-category aggregation (server-side clustering is preferred, but client-side aggregation via worker is possible for moderate counts).
5. Caching and invalidation
   - Encode filter signature in URLs so service worker cache keys are accurate.
   - Implement TTL and stale-while-revalidate policies; for volatile filters (availability, dynamic status), use short TTLs or on-demand invalidation.

Client-side integration notes
- When switching category:
  - Update the Mapbox source to request the tile/JSON URLs for the selected category.
  - The service worker will serve cached responses for that category, while the worker decodes and returns features to the main thread for rendering.
- Use small payloads for tiles (minimal props) and lazy-load large assets (photos) on popup click.
- If switching categories often, the service worker prefetch can warm caches for other categories in view.

Trade-offs and limitations
- Server changes required: category-aware tile endpoints or queryable endpoints are essential for maximum benefit.
- Cache growth: caching many category+tile combinations can increase storage usage — use TTL and LRU eviction.
- Complexity: adding service workers + web workers increases system complexity and testing surface.
- Browser support: Service Workers and Cache Storage are widely supported but verify in target browsers; vector tile (PBF) decoding may require additional libraries in a Web Worker.

When this is a good fit
- Good fit if:
  - You can produce deterministic, category-aware tile URLs from your backend (Xano or Bubble).
  - Your app frequently switches categories for the same geographic area (cache warm hits).
  - You want offline/resilience behavior and to reduce redundant network fetches across tabs.
- Less beneficial if:
  - You always fetch fully dynamic filters that rarely repeat across requests, causing low cache hit rates.
  - You cannot change the server to return deterministic category/tile responses.

Summary / recommendation
- Use Service Workers to cache and serve category-specific tile/JSON responses, and use Web Workers to offload parsing/processing. This combination yields the best client-side performance when toggling categories and revisiting areas.
- Implement server-side category-aware tiles or compact JSON endpoints first (small payloads). Then add a service worker (Cache Storage + stale-while-revalidate) and Web Worker decoding pipeline.
- If you want, I can:
  - Add a service-worker prototype and integrate an IndexedDB/Cache Storage check into map.js (requires creating deterministic tile endpoints), or
  - Start by adding a Web Worker parser for large JSON responses to avoid main-thread jank while we arrange server-side endpoints.

Choose which you'd like me to implement first and I will modify the repo accordingly.
High-impact, recommended changes:
1. Switch from "fetch all" to viewport / tile-based fetching:
   - Request only features that intersect the current map bounds (with padding). This reduces payload drastically on initial load and when panning.
   - Implement a cache keyed by tile / geohash / bbox + filter signature to avoid re-requesting data when panning back.
2. Use server-side vector tiles or a hosted vector tileset for static location data:
   - Best performance at scale. Tools: tippecanoe to build MBTiles, host via Mapbox/tileserver.
3. Enable Mapbox clustering (if staying with GeoJSON):
   - Configure cluster:true on the GeoJSON source to collapse many points into a single cluster marker at low zooms. This dramatically reduces draw calls and improves interactivity.
4. Reduce payload size:
   - Return only what’s needed to display the map (lon/lat, bubble_id, short label, icon URL). Fetch detailed metadata (images, descriptions) on card/popup open.
5. Add fetch timeouts and cancellation:
   - Use AbortController to cancel in-flight requests when filters change; set a reasonable timeout (e.g., 15–30s).
6. Re-run image preload after style changes:
   - After `map.setStyle(...)` and `map.once('style.load', ...)` call `preloadImagesAndAddData(allMarkersData)` to ensure icons exist in the new style.
7. Client-side optimizations:
   - Use a Set for `surfaceFilteredLocationIDs` membership checks.
   - Batch large `addMarkers` operations across multiple frames (chunking) or use requestAnimationFrame to avoid single-frame freezes.
   - Use Web Worker for heavy filtering or preprocessing, keeping main thread responsive.

Lower-effort improvements:
- Remove duplicate `movestart` listener and duplicate variable declarations.
- Display a user-facing error message on repeated fetch failure (not just console errors).
- Disable heavy overlays by default (e.g., weather/air quality) and let users opt-in.

---

## Tradeoffs to consider
- Viewport-based fetching may complicate some filter semantics if filters must be globally applied; server must support bbox/geo queries or tile endpoints.
- Vector tiles require a build pipeline (tippecanoe or tileserver) and handling for dynamic filters (some filters may require server-side indexing or dynamic tile generation).
- Clustering provides a much better UX at low zooms but requires handling cluster expansion and possibly additional interactions.

---

## Conclusion and next steps
- Current implementation fetches the entire dataset by design and caches it in memory for the session, which is simple but does not scale well to tens of thousands of records.
- For 70,000+ records, move away from the “fetch everything” approach. The fastest wins: server-side vector tiles or viewport-based fetching combined with Mapbox clustering and reduced payloads.
