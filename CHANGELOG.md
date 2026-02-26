## [0.3.3](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.2...v0.3.3) (2026-02-26)


### Bug Fixes

* **letsrunit:** add repository field required for npm provenance verification ([d1e5270](https://github.com/letsrunit-hq/letsrunit/commit/d1e5270ddef23a54f2091d782da5167369cade8e))

## [0.3.2](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.1...v0.3.2) (2026-02-26)


### Bug Fixes

* **release:** revert unsupported --no-bail flag from workspaces foreach ([228dd74](https://github.com/letsrunit-hq/letsrunit/commit/228dd7472292937517f74291d9e4c8be20b6f390))

## [0.3.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.0...v0.3.1) (2026-02-26)


### Bug Fixes

* **release:** add --no-bail to workspaces publish so one failure does not abort the rest ([892c126](https://github.com/letsrunit-hq/letsrunit/commit/892c1268f0aa0c7ae63048db316f0b7c6d43040a))

# [0.3.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.2.6...v0.3.0) (2026-02-26)


### Bug Fixes

* **@letsrunit/bdd:** add Before/After hooks and fix cucumber setup ([74a3dac](https://github.com/letsrunit-hq/letsrunit/commit/74a3dacc347c565aa03b19b5b06f0f8906863831))
* **@letsrunit/playwright:** add short timeouts in elementKind to prevent hangs ([044e8b4](https://github.com/letsrunit-hq/letsrunit/commit/044e8b41b8f168e21abf53b078b734035c733704))
* **build:** add platform node and CJS compat to Node-only packages ([49f50b1](https://github.com/letsrunit-hq/letsrunit/commit/49f50b1747112fa28f58fe3dc14718d75ec977a1))
* **ci:** add playwright dep, robust web server check, heading locator ([c5855ad](https://github.com/letsrunit-hq/letsrunit/commit/c5855ad895cd192ba93b250a6bbaec3214eec238))
* **ci:** add type:module, overrides for all PMs, Content-Type header ([bb17335](https://github.com/letsrunit-hq/letsrunit/commit/bb1733582ede57dda890f284e8d68a50cdaa0fbc))
* **ci:** fix all four init matrix job failures ([dfa28c2](https://github.com/letsrunit-hq/letsrunit/commit/dfa28c2f03c5a1a5e77e802c2b7d2f0d8473fdb2))
* **ci:** fix pnpm playwright exec and web server port conflict ([30510f1](https://github.com/letsrunit-hq/letsrunit/commit/30510f1774ee71c6f69a853a53f7d0de53a2c660))
* **ci:** pack and override @letsrunit/executor with local build ([06bc3d9](https://github.com/letsrunit-hq/letsrunit/commit/06bc3d962d72ee83de3275c60efe234aca51d92d))
* **cli:** add createRequire banner to tsup build ([99db91d](https://github.com/letsrunit-hq/letsrunit/commit/99db91dc9289fbe21d4a5698610ca41ee97246b6))
* **letsrunit:** fix generated cucumber.js config and example feature ([8ea02df](https://github.com/letsrunit-hq/letsrunit/commit/8ea02dff93d12fe149140855aa851a3aad4b3010))
* **letsrunit:** use @letsrunit/bdd/define in cucumber.js template ([0e370fb](https://github.com/letsrunit-hq/letsrunit/commit/0e370fbd3466f082674d43b508e21b0df283defa))
* **letsrunit:** use setDefaultTimeout in support file instead of config timeout ([427a1b6](https://github.com/letsrunit-hq/letsrunit/commit/427a1b6e283f4e5da44895d0cedf4fe83c89a50f))


### Features

* **@letsrunit/bdd:** expose ./define as a named package export ([9aca951](https://github.com/letsrunit-hq/letsrunit/commit/9aca9510eab262aea81cac9f98aef2ebcc821db0))
* **letsrunit/cli:** expose init as library and wire into cli ([ef0da07](https://github.com/letsrunit-hq/letsrunit/commit/ef0da073d5bebcf5839d3cc960320eeb36ae3ce6))
* **letsrunit:** add init package scaffold ([8b306bb](https://github.com/letsrunit-hq/letsrunit/commit/8b306bbbf091a60dbbf17fe60500204b77071196))
* **letsrunit:** prompt to add GitHub Actions workflow for Cucumber features ([5ea8c34](https://github.com/letsrunit-hq/letsrunit/commit/5ea8c3427dc2822484f68407034b631b6c80527c))
* **letsrunit:** prompt to install @cucumber/cucumber if not found ([99111ba](https://github.com/letsrunit-hq/letsrunit/commit/99111baa25d3bddfb1b75babae1f52a0a37095a0))
* **letsrunit:** refactor init flow and add Playwright browser check ([b9d7baa](https://github.com/letsrunit-hq/letsrunit/commit/b9d7baad20594ef6091849eeb5dbf99b1c88e547))

## [0.2.6](https://github.com/letsrunit-hq/letsrunit/compare/v0.2.5...v0.2.6) (2026-02-19)


### Bug Fixes

* bump ([81ba34d](https://github.com/letsrunit-hq/letsrunit/commit/81ba34dda291b83727fe8a67736a350381e08ab5))

## [0.2.5](https://github.com/letsrunit-hq/letsrunit/compare/v0.2.4...v0.2.5) (2026-02-19)


### Bug Fixes

* Bump ([43a4fc6](https://github.com/letsrunit-hq/letsrunit/commit/43a4fc653ed23a4a8b3191b6c01aa4600f4a7205))

## [0.2.4](https://github.com/letsrunit-hq/letsrunit/compare/v0.2.3...v0.2.4) (2026-02-19)


### Bug Fixes

* correct repository URL from letsrunit/letsrunit to letsrunit-hq/letsrunit ([c9dbb61](https://github.com/letsrunit-hq/letsrunit/commit/c9dbb6165af9f9ffd2c86fa74c13d72f3a88dcc9))

## [0.2.3](https://github.com/letsrunit-hq/letsrunit/compare/v0.2.2...v0.2.3) (2026-02-19)


### Bug Fixes

* **release:** revert to yarn npm publish; rename workflow to publish.yml ([44aa057](https://github.com/letsrunit-hq/letsrunit/commit/44aa057638b362ccda88f20c2fcb626d2c0b5584))

## [0.2.2](https://github.com/letsrunit-hq/letsrunit/compare/v0.2.1...v0.2.2) (2026-02-19)


### Bug Fixes

* **release:** use yarn pack + npm publish for OIDC publishing ([fae9f1e](https://github.com/letsrunit-hq/letsrunit/commit/fae9f1e893e1dcbbab44c5866a412c5bcbe2ef8f))

## [0.2.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.2.0...v0.2.1) (2026-02-19)


### Bug Fixes

* **release:** mark root workspace as private to prevent publish attempt ([84ef8e6](https://github.com/letsrunit-hq/letsrunit/commit/84ef8e65cef31e4297da1bd0dd6765dc4f7b184e))

# [0.2.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.1.1...v0.2.0) (2026-02-19)


### Bug Fixes

* **@letsrunit/cli:** read version dynamically from package.json ([040f4d0](https://github.com/letsrunit-hq/letsrunit/commit/040f4d0a10af801fea7f954777f18700c51d5e8c))
* **gherkin:** relax time regex to allow single-digit hours and minutes ([628683c](https://github.com/letsrunit-hq/letsrunit/commit/628683cabb4236fbe5d29e1c7eb3309ade749661))
* **mcp-server:** use hash-based filename for letsrunit_screenshot ([6866e32](https://github.com/letsrunit-hq/letsrunit/commit/6866e32ccf37f7717aba94da3b3b0e5d4a548c1f))


### Features

* add @letsrunit/mcp-server package with MCP tools and skill.md ([50590d9](https://github.com/letsrunit-hq/letsrunit/commit/50590d998d5a207f55c2d20296b920609e092c7d))
* add MCP server with tools, tests, and agentskills skill ([1026f32](https://github.com/letsrunit-hq/letsrunit/commit/1026f32a9518928eb9cbe25646823fbf2eb127c0))
* **controller:** expose page getter for MCP server access ([7d61776](https://github.com/letsrunit-hq/letsrunit/commit/7d61776e76d0912def7f060b5f492938f19b6d86))
