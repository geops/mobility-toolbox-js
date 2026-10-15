# mobility-toolbox-js

Toolbox for JavaScript applications in the domains of mobility and logistics.
The tools in this library have been inspired by many projects realized for public transport agencies, mobility providers and logistics companies.

[![npm](https://img.shields.io/npm/v/mobility-toolbox-js.svg?style=flat-square)](https://www.npmjs.com/package/mobility-toolbox-js)
[![Build](https://github.com/geops/mobility-toolbox-js/actions/workflows/build.yml/badge.svg)](https://github.com/geops/mobility-toolbox-js/actions/workflows/build.yml)
[![Lint / Unit tests](https://github.com/geops/mobility-toolbox-js/actions/workflows/test.yml/badge.svg)](https://github.com/geops/mobility-toolbox-js/actions/workflows/test.yml)
![Vercel](https://vercelbadge.vercel.app/api/geops/mobility-toolbox-js)

## Documentation and examples

Visit https://mobility-toolbox-js.geops.io/

## Demos

* Display [real-time vehicle positions and prognosis data](https://mobility.portal.geops.io) on a map.
* Search for [stops and stations](https://maps.trafimage.ch) all over the world.
* Get [precise geographic courses](https://routing-demo.geops.io/) for all modes of transport.
* Generate beautiful [schematic](https://mobility.portal.geops.io/world.geops.networkplans) or [topographic](https://mobility.portal.geops.io) maps for public transport, mobility and logistics.

## Install

Install the library and the peer dependencies:

```bash
pnpm add ol maplibre-gl mobility-toolbox-js
```

## Development

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts a vite server using the `index.html` file at the root of the project.
This html file loads the `dev.js` file. Use this file to develop the library.
Each time you modifiy the library code you have to run `pnpm build:tsc` to see the changes.

## MapLibre worker issue

Since `maplibre-gl` v6, the library ships as ES modules only and resolves its worker script via `import.meta.url`.
Bundlers (Vite, webpack, esbuild, rspack, Rollup) can't always resolve this correctly inside their module graph, which can lead to the map failing to render or to worker-related errors in the browser console.

See the [MapLibre v5 to v6 migration guide](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/) for more details, notably the [`setWorkerUrl()` is bundler-only](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/#setworkerurl-is-bundler-only) section.

### Vite fix

Exclude `maplibre-gl` from Vite's dependency pre-optimization so it keeps resolving the worker asset itself (see `doc/src/components/StackBlitzButton.js`):

```js
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
});
```

### Next.js (webpack) fix

Serve `maplibre-gl`'s worker file from `public/` and point to it explicitly with `setWorkerUrl()`, since webpack can't statically resolve the worker asset (see `doc/package.json` and `doc/pages/_app.js`):

```bash
cp node_modules/maplibre-gl/dist/maplibre-gl* public/
```

```js
import { setWorkerUrl } from "maplibre-gl";

if (typeof window !== "undefined") {
  setWorkerUrl("/maplibre-gl-worker.mjs");
}
```

## Development documentation

The documentations website is located in the `doc/`  folder.
It's a nextJS website that use the mobility-toolbox-js library built from the `build/` folder.

## Deploy

This library website is deployed automatically using [Vercel](https://vercel.com/geops).
For Vercel we have to add the nextjs and raw-loader modules in the dev dependencies of the main package.json.
But those 2 librairies are not needed to build the library.
