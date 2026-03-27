# [0.9.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.8.0...v0.9.0) (2026-03-27)


### Features

* **mcp-server:** add letsrunit_list_steps MCP tool ([08804c4](https://github.com/letsrunit-hq/letsrunit/commit/08804c41feef034f253626e85c110d9fb474349f))
* replace 'not contains' with 'does not contain' ([044a85c](https://github.com/letsrunit-hq/letsrunit/commit/044a85c7a53253a3dd61d0687eb6f732a536fc05))

# [0.8.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.7.1...v0.8.0) (2026-03-25)


### Bug Fixes

* **cucumber:** align AstStep dataTable with readonly DataTable ([9088b44](https://github.com/letsrunit-hq/letsrunit/commit/9088b445095941d04dd2197b33a63721951fc2b3))
* **store:** import Database from node-sqlite3-wasm default export ([45285d4](https://github.com/letsrunit-hq/letsrunit/commit/45285d48724d21c2caf40b2dd9328cdcc1b0f6f9))


### Features

* **playwright:** add dropUtilityClasses option to snapshot and scrubHtml ([d21f08e](https://github.com/letsrunit-hq/letsrunit/commit/d21f08e645849ced41b17bef68eb332e6ddb4e1d))
* **store,mcp:** add letsrunit_diff tool with content-based scenario IDs ([e81477d](https://github.com/letsrunit-hq/letsrunit/commit/e81477d090c18d5d33dc0cd8dbdfae7fd47999cf))

## [0.7.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.7.0...v0.7.1) (2026-03-25)


### Bug Fixes

* **playwright:** make fuzzy locator fallbacks lazy via union ([9b759a4](https://github.com/letsrunit-hq/letsrunit/commit/9b759a474e9bc40f5694c732d9bf2c1c60856c2d))

# [0.7.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.6.0...v0.7.0) (2026-03-20)


### Features

* **cucumber:** add artifact store formatter (@letsrunit/cucumber/artifacts) ([6515950](https://github.com/letsrunit-hq/letsrunit/commit/65159509d5cf0340e94f71c1db119d97a3d92dd1))
* **cucumber:** attach screenshot and scrubbed HTML after each step ([8c05212](https://github.com/letsrunit-hq/letsrunit/commit/8c052122105613fe7493fb90b85e4a35f7daffea))
* extract @letsrunit/cucumber package from @letsrunit/bdd ([65d59b8](https://github.com/letsrunit-hq/letsrunit/commit/65d59b8ac56d7d578a069004a930e8246e86df41))
* **store:** add @letsrunit/store SQLite package and wire into artifacts formatter ([52745ba](https://github.com/letsrunit-hq/letsrunit/commit/52745babc37de68a08f67799b3d0d41a17429809))

# [0.6.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.5.1...v0.6.0) (2026-03-12)


### Bug Fixes

* **bdd:** Fix viewport step in bdd package ([4d4ccd2](https://github.com/letsrunit-hq/letsrunit/commit/4d4ccd2347d5cedce2e8c9be4b2732aac46ecc60))


### Features

* Added step definition to set screensize (viewport) ([c716ec9](https://github.com/letsrunit-hq/letsrunit/commit/c716ec966598b764812eaa77983eaee2f59c9f0e))

## [0.5.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.5.0...v0.5.1) (2026-03-12)


### Bug Fixes

* **letsrunit:** Add require support files for cucumber on install. ([b8fc1cb](https://github.com/letsrunit-hq/letsrunit/commit/b8fc1cbbc8d43bb06200bb54254c604c20d0a93a))

# [0.5.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.4.2...v0.5.0) (2026-03-12)


### Bug Fixes

* **calendar:** accept aria-haspopup triggers (Radix Popover / button pattern) ([6bcb6b0](https://github.com/letsrunit-hq/letsrunit/commit/6bcb6b0cad7f80d2549de8c2aa34334543b7bed2))


### Features

* **aria-select:** add selectAria for role=combobox/listbox/option pattern ([0f08e75](https://github.com/letsrunit-hq/letsrunit/commit/0f08e751580fcfab545e1a8fb4327e041b4c4d13))
* **radio-group:** add ARIA radio support (role="radio") to setRadioGroup ([a8a96f3](https://github.com/letsrunit-hq/letsrunit/commit/a8a96f37d5029af7530644f1f665820095d92122))
* **slider:** add keyboard fallback when drag is unresponsive ([8371a58](https://github.com/letsrunit-hq/letsrunit/commit/8371a583dc593509285bcb17a4bfb84fde0bc632))
* **toggle:** add setToggle for ARIA toggle components (role=checkbox/switch) ([a3d448f](https://github.com/letsrunit-hq/letsrunit/commit/a3d448f706a0985b943a2ef47270cdde4d0726b4))

## [0.4.2](https://github.com/letsrunit-hq/letsrunit/compare/v0.4.1...v0.4.2) (2026-03-12)


### Bug Fixes

* read MCP server version from package.json ([f49633b](https://github.com/letsrunit-hq/letsrunit/commit/f49633b841ee31c6eb0bf18471854c48b9a2e246))

## [0.4.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.4.0...v0.4.1) (2026-03-12)


### Bug Fixes

* workspace packages export src, add tsx loader for cucumber ([5bce2bd](https://github.com/letsrunit-hq/letsrunit/commit/5bce2bdababd72b4d2139cc3cb0040b7d5044530)), closes [#32](https://github.com/letsrunit-hq/letsrunit/issues/32)

# [0.4.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.10...v0.4.0) (2026-03-12)


### Features

* custom step definitions via shared registry ([9df6f22](https://github.com/letsrunit-hq/letsrunit/commit/9df6f2273a76bd4930cffd62059da4dfce5b7b28))

## [0.3.10](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.9...v0.3.10) (2026-03-02)


### Bug Fixes

* make workspace packages resolve to dist so cucumber-js runs without a TS loader ([17ecbc9](https://github.com/letsrunit-hq/letsrunit/commit/17ecbc970f4e209c401df58ecc8301831f556229))

## [0.3.9](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.8...v0.3.9) (2026-03-02)


### Bug Fixes

* **controller:** rename flag to selectorsAreRegistered, fix areAllVisible and test mock ([c2c544f](https://github.com/letsrunit-hq/letsrunit/commit/c2c544f3dd5636cb3e2e26ba6039b8d531dacb55))
* **locators:** add adjacent sibling <label> support to field selector engine ([ce126f6](https://github.com/letsrunit-hq/letsrunit/commit/ce126f62d3b3ff5bcec65112f8d8555711061da0))
* **locators:** use regex substring matching for text= selector and guard invalid CSS IDs ([b37e421](https://github.com/letsrunit-hq/letsrunit/commit/b37e421fec0f0036e4ffe2c6c23486d7f28f9b16)), closes [#What](https://github.com/letsrunit-hq/letsrunit/issues/What)


### Reverts

* **mcp-server:** use page.locator() directly for screenshot mask ([27f9add](https://github.com/letsrunit-hq/letsrunit/commit/27f9add041139c4b0b9e8c0b235d391f48d46e3c))

## [0.3.8](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.7...v0.3.8) (2026-02-27)


### Bug Fixes

* **mcp-server:** add baseURL parameter to letsrunit_session_start ([a002ad0](https://github.com/letsrunit-hq/letsrunit/commit/a002ad0a813dc7f3da6e09d39f9e40b2486c9712))
* **mcp-server:** default headless to false so browser is visible by default ([e2f3417](https://github.com/letsrunit-hq/letsrunit/commit/e2f3417ed1f994dfca73449b9dc64c9166e5e364))
* **mcp-server:** resolve letsrunit locators in screenshot mask ([9400d29](https://github.com/letsrunit-hq/letsrunit/commit/9400d2935567eb3850263d0319be6d983dc4a680))

## [0.3.7](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.6...v0.3.7) (2026-02-27)


### Bug Fixes

* **playwright:** export scrubHtml from package index ([78f9ac7](https://github.com/letsrunit-hq/letsrunit/commit/78f9ac787f95c2392103289fa444f095b67bcf4b))

## [0.3.6](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.5...v0.3.6) (2026-02-26)


### Bug Fixes

* **release:** publish all packages to consistent version ([7dde227](https://github.com/letsrunit-hq/letsrunit/commit/7dde227e40e73a52e9f67ee32de037483675b104))

## [0.3.5](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.4...v0.3.5) (2026-02-26)


### Bug Fixes

* **plugin:** restructure as proper Claude Code marketplace plugin ([8882296](https://github.com/letsrunit-hq/letsrunit/commit/888229631c13ee252205a0b73fd8c2a149c7f499))

## [0.3.4](https://github.com/letsrunit-hq/letsrunit/compare/v0.3.3...v0.3.4) (2026-02-26)


### Bug Fixes

* **plugin:** add Claude Code plugin manifest and MCP server config ([892c622](https://github.com/letsrunit-hq/letsrunit/commit/892c622ca3795c5a32524d4d25c8cec9c1b6a374))

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
