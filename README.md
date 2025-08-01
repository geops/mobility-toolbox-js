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
yarn add ol maplibre-gl mobility-toolbox-js
```

## Development

```bash
yarn install
yarn dev
```

`yarn dev` starts a vite server using the `index.html` file at the root of the project.
This html file loads the `dev.js` file. Use this file to develop the library.
Each time you modifiy the library code you have to run `yarn build:tsc` to see the changes.

## Development documentation

The documentations website is located in the `doc/`  folder.
It's a nextJS website that use the mobility-toolbox-js library built from the `build/` folder.

## Deploy

This library website is deployed automatically using [Vercel](https://vercel.com/geops).
For Vercel we have to add the nextjs and raw-loader modules in the dev dependencies of the main package.json.
But those 2 librairies are not needed to build the library.
