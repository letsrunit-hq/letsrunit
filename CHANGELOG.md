## [0.19.4](https://github.com/letsrunit-hq/letsrunit/compare/v0.19.3...v0.19.4) (2026-04-24)


### Bug Fixes

* doc assets not in hidden dir ([756ba78](https://github.com/letsrunit-hq/letsrunit/commit/756ba786c7c0ec5083feb7203b3dc370571e45b9))

## [0.19.3](https://github.com/letsrunit-hq/letsrunit/compare/v0.19.2...v0.19.3) (2026-04-24)


### Bug Fixes

* **ci:** use upload-pages-artifact with hidden files for docs deploy ([ac4cf23](https://github.com/letsrunit-hq/letsrunit/commit/ac4cf23c7a653d86ecb8f5abd17b82218edc5552))

## [0.19.2](https://github.com/letsrunit-hq/letsrunit/compare/v0.19.1...v0.19.2) (2026-04-19)


### Bug Fixes

* **docs:** include .gitbook assets in pages artifact ([bdeaf68](https://github.com/letsrunit-hq/letsrunit/commit/bdeaf68c3edab376fa90df10e05c7f3f0729ecf9))

## [0.19.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.19.0...v0.19.1) (2026-04-17)


### Bug Fixes

* **cucumber:** rely on {fuzzy} marker for locator reporting ([a19180b](https://github.com/letsrunit-hq/letsrunit/commit/a19180b6654c74c2554a1dd4e47d5dbe6b818b98))
* **playwright:** use following-sibling for role-name proximity fallback ([ec4bd97](https://github.com/letsrunit-hq/letsrunit/commit/ec4bd97d343cf7942c2f5593ce08e557263d9a41))
* **playwright:** use ordered runtime fallback locator ([bfe1fa2](https://github.com/letsrunit-hq/letsrunit/commit/bfe1fa25acb3c196191d5e9ccae31b9e1980dde3))

# [0.19.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.18.3...v0.19.0) (2026-04-16)


### Bug Fixes

* **journal:** refactor SupabaseSink to match the new DB model ([d4b58c0](https://github.com/letsrunit-hq/letsrunit/commit/d4b58c0ee2330acb4814ac6fe983df1b0f226651))


### Features

* **journal:** refactor SupabaseSink to match the new DB model ([dd98fc2](https://github.com/letsrunit-hq/letsrunit/commit/dd98fc27b532441b74e59224d40014418fc59ab0))

## [0.18.3](https://github.com/letsrunit-hq/letsrunit/compare/v0.18.2...v0.18.3) (2026-04-16)


### Bug Fixes

* **ci:** align Playwright container version with test deps ([ae9e8bf](https://github.com/letsrunit-hq/letsrunit/commit/ae9e8bf8d3409d14d29e9bf11d9fda4645448476))
* **ci:** pin init integration playwright version ([e6b0890](https://github.com/letsrunit-hq/letsrunit/commit/e6b08907df3f54691721216ca5245fa90da3d8eb))
* **compat-angular:** replace hanging angular20 suite with working ct baseline ([8db7e27](https://github.com/letsrunit-hq/letsrunit/commit/8db7e271ec40812cbc341cd494bf90523064dad0))
* **playwright:** add generic composite field handlers for angular compat ([83e0cb4](https://github.com/letsrunit-hq/letsrunit/commit/83e0cb40861a0ddd55edf121d14abffdd8dd93a3))
* **playwright:** support late listbox binding in aria combobox ([fa5eded](https://github.com/letsrunit-hq/letsrunit/commit/fa5eded6fea01525c90b6c2d07ad9cc860853804))
* **playwright:** treat closed listbox as successful aria selection ([53ed638](https://github.com/letsrunit-hq/letsrunit/commit/53ed638e4a13eacbe9999c1ce087b56a4142ac9c))

## [0.18.2](https://github.com/letsrunit-hq/letsrunit/compare/v0.18.1...v0.18.2) (2026-04-15)


### Bug Fixes

* **controller:** disable capture by default ([461e6b1](https://github.com/letsrunit-hq/letsrunit/commit/461e6b110c2ce836e3a952612ad1b476db05ebab))
* **playwright:** handle svg className in utility class stripping ([1770d16](https://github.com/letsrunit-hq/letsrunit/commit/1770d16c42eba8b6095e019fe79cc25855bd5e6a)), closes [#60](https://github.com/letsrunit-hq/letsrunit/issues/60)

## [0.18.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.18.0...v0.18.1) (2026-04-15)


### Bug Fixes

* **cucumber:** log unexpected errors when gathering attachments in cucumber reporter ([6387f0a](https://github.com/letsrunit-hq/letsrunit/commit/6387f0adde677d96539e540bbaa1f4086c7f8651))

# [0.18.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.17.1...v0.18.0) (2026-04-13)


### Features

* **cucumber:** include html snapshot when diff is unavailable ([ec8f815](https://github.com/letsrunit-hq/letsrunit/commit/ec8f8150ed10313342d9270c70dd22bd0eb54c5f))
* **playwright:** enable utility class scrubbing by default ([57618f6](https://github.com/letsrunit-hq/letsrunit/commit/57618f67bccd20ddcf7e695469c01e64d04017cb))

## [0.17.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.17.0...v0.17.1) (2026-04-13)


### Bug Fixes

* **cucumber:** auto-select agent formatter by environment ([cc949eb](https://github.com/letsrunit-hq/letsrunit/commit/cc949eb2d06a5030fd94ef7a727bb3345855bf1e))
* **cucumber:** fix dts enum status lookup ([eee9e51](https://github.com/letsrunit-hq/letsrunit/commit/eee9e5151f5614bb386f08eeaf2d75230892ec45))
* **cucumber:** stream compact agent formatter output ([1395826](https://github.com/letsrunit-hq/letsrunit/commit/1395826ed54b12d6a5766f5d7cadb615c1027f11))
* **cucumber:** streamline agent NDJSON failure payload ([98b36e9](https://github.com/letsrunit-hq/letsrunit/commit/98b36e9b62431a028183ec29632ed71807fe9814))

# [0.17.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.16.0...v0.17.0) (2026-04-13)


### Bug Fixes

* **cli:** make target optional with cucumber world fallback ([35af6a1](https://github.com/letsrunit-hq/letsrunit/commit/35af6a177ab60dbf0d62b6601b3a2d8334a112ba))


### Features

* **gherkin:** support password value literals with required seed ([dba94ab](https://github.com/letsrunit-hq/letsrunit/commit/dba94abb84243beafb9fec691ecfc0ccee443a58))

# [0.16.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.15.1...v0.16.0) (2026-04-13)


### Features

* **gherkin:** support within iframe locator traversal ([3633710](https://github.com/letsrunit-hq/letsrunit/commit/3633710b8da0982834da96387bcacb979197bb59))

## [0.15.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.15.0...v0.15.1) (2026-04-13)


### Bug Fixes

* Improve CLI help ([3b3bf31](https://github.com/letsrunit-hq/letsrunit/commit/3b3bf310255538a4d15eeb3b0e42d24cedebf33f))

# [0.15.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.14.5...v0.15.0) (2026-04-11)


### Bug Fixes

* **mcp-server:** avoid hard import on reload registry reset ([85f94f2](https://github.com/letsrunit-hq/letsrunit/commit/85f94f200f9bde0f7dbcaa26853f9640fd5cc696))


### Features

* **mcp-server:** add explicit step reload tool ([77ef5ec](https://github.com/letsrunit-hq/letsrunit/commit/77ef5ecd58d8e34bb4a334dbfa2b5115ebac18c0))

## [0.14.5](https://github.com/letsrunit-hq/letsrunit/compare/v0.14.4...v0.14.5) (2026-04-11)


### Bug Fixes

* **mcp-server:** pass runtime mode explicitly to session startup ([c11d38e](https://github.com/letsrunit-hq/letsrunit/commit/c11d38e353ae772e5f931a667814865a16804c61))
* **mcp-server:** simplify runtime mode handoff and diagnostics ([4739b5d](https://github.com/letsrunit-hq/letsrunit/commit/4739b5db8bd3b807ae7270ee297dab44ee0263c5))

## [0.14.4](https://github.com/letsrunit-hq/letsrunit/compare/v0.14.3...v0.14.4) (2026-04-11)


### Bug Fixes

* **mcp-server:** inject build-time version constant ([f9a14a1](https://github.com/letsrunit-hq/letsrunit/commit/f9a14a11b24e5501b512c6e616b9665c3339ebbe))

## [0.14.3](https://github.com/letsrunit-hq/letsrunit/compare/v0.14.2...v0.14.3) (2026-04-10)


### Bug Fixes

* **mcp-server:** simplify runtime handoff and improve diagnostics ([fd90cc2](https://github.com/letsrunit-hq/letsrunit/commit/fd90cc2b83eb2cc9acdfe88ceae2b6aa369f05a2))

## [0.14.2](https://github.com/letsrunit-hq/letsrunit/compare/v0.14.1...v0.14.2) (2026-04-10)


### Bug Fixes

* **mcp-server:** resolve project handoff without package.json subpath ([fee014f](https://github.com/letsrunit-hq/letsrunit/commit/fee014f39debd275c84dd826133095e36cf697d7))

## [0.14.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.14.0...v0.14.1) (2026-04-10)


### Bug Fixes

* bump ([b617ff6](https://github.com/letsrunit-hq/letsrunit/commit/b617ff66ed6d0adb218759f24f1f7676b33ad987))

# [0.14.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.13.3...v0.14.0) (2026-04-09)


### Features

* **init:** install project mcp server by default ([a5fa1f7](https://github.com/letsrunit-hq/letsrunit/commit/a5fa1f748d364940ef38a2dd9a0f5fdd84098756))
* **mcp-server:** hand off to project-local server when available ([ec343bf](https://github.com/letsrunit-hq/letsrunit/commit/ec343bf0bad7dff4920b333f9184481f814b8ef4))

## [0.13.3](https://github.com/letsrunit-hq/letsrunit/compare/v0.13.2...v0.13.3) (2026-04-09)


### Bug Fixes

* **ci:** restore inspector-based mcp npx check ([3da7343](https://github.com/letsrunit-hq/letsrunit/commit/3da73439dfac2b7a30d19a57e35ff1e791cd7e83))
* **cucumber:** add ignore configuration for world.js in letsrunit setup ([51f99b5](https://github.com/letsrunit-hq/letsrunit/commit/51f99b571ce0e4588008f65bfecc1a00cc166bf6))
* **mcp-server:** avoid bundling node_modules in esm build ([c8366eb](https://github.com/letsrunit-hq/letsrunit/commit/c8366eb8d2dbca53f418d286f8222406558ee443))

## [0.13.2](https://github.com/letsrunit-hq/letsrunit/compare/v0.13.1...v0.13.2) (2026-04-08)


### Bug Fixes

* **mcp-server:** add createRequire shim to bundled entry ([e616df4](https://github.com/letsrunit-hq/letsrunit/commit/e616df45dd288d19ee3dddd8b619367ba54c6a0f))

## [0.13.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.13.0...v0.13.1) (2026-04-08)


### Bug Fixes

* **mcp-server:** enable node shims for ESM bundle ([6d146ae](https://github.com/letsrunit-hq/letsrunit/commit/6d146aec7f63bde4b657e949b8306bae0a943b7b))

# [0.13.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.12.0...v0.13.0) (2026-04-07)


### Bug Fixes

* **cucumber:** keep URL attachments despite scrub failures ([02828cb](https://github.com/letsrunit-hq/letsrunit/commit/02828cb5eee2effb23eac1be94845386e19be9ad))
* **cucumber:** simplify fuzzy locators in progress output ([c43fd3d](https://github.com/letsrunit-hq/letsrunit/commit/c43fd3daa1020c1e9dbbe4c603465fa458e67855))


### Features

* **cucumber:** add config helper for headed fail-fast debug runs ([11e09b1](https://github.com/letsrunit-hq/letsrunit/commit/11e09b16dd958201378ff8f386bc0041209b7013))
* **cucumber:** add run policy and config helpers ([877991e](https://github.com/letsrunit-hq/letsrunit/commit/877991ea69f7553085e2e53bc39e8c93fa33e230))

# [0.12.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.11.0...v0.12.0) (2026-04-06)


### Features

* **cucumber:** add agent NDJSON formatter ([be6a41a](https://github.com/letsrunit-hq/letsrunit/commit/be6a41a62a73029a61d429c87ee6858eb9ea7695))

# [0.11.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.10.0...v0.11.0) (2026-04-05)


### Bug Fixes

* **build:** add package-level tsup configs across workspaces ([201386b](https://github.com/letsrunit-hq/letsrunit/commit/201386b496bdcb896ffefac141a6e4e321b6b610))
* **ci:** include store tarball in init matrix overrides ([c84cc72](https://github.com/letsrunit-hq/letsrunit/commit/c84cc72e57964ee4bc06d380fb42238f90bf03c4))
* **cucumber:** expose store as plugin-only entrypoint ([fb0d518](https://github.com/letsrunit-hq/letsrunit/commit/fb0d518af4cb4397878560dedf4472083b71bfd5))
* **cucumber:** finalize custom progress reporter wiring ([d5e81c2](https://github.com/letsrunit-hq/letsrunit/commit/d5e81c20f446ef1e6a52ce4194e167e84cd770fc))
* **cucumber:** make store directory creation idempotent ([0d407d9](https://github.com/letsrunit-hq/letsrunit/commit/0d407d91922c5a230a9aee47988a6c06147e32b0))
* **cucumber:** silence git lookup outside repositories ([5a69a36](https://github.com/letsrunit-hq/letsrunit/commit/5a69a3640b28c560339c5eb863f23d711528c2c8))
* **cucumber:** treat store directory as letsrunit root ([18cc702](https://github.com/letsrunit-hq/letsrunit/commit/18cc702af1036d96923777682105209c5a8206e1))
* **cucumber:** use package subpath for store plugin specifier ([f4204e8](https://github.com/letsrunit-hq/letsrunit/commit/f4204e8f300aae9aad46381b31a3da1194393f2d))
* don't specify the formatter in cucumber config ([af6a3be](https://github.com/letsrunit-hq/letsrunit/commit/af6a3bedd9360dfcffd18ca08e1c1a863678cb4f))
* **gherkin:** accept readonly envelopes from generateMessages ([4e1c337](https://github.com/letsrunit-hq/letsrunit/commit/4e1c3373e754e03942ede428c8e3ff410d9e4d97))
* no path imports to other packages ([9fe4dbf](https://github.com/letsrunit-hq/letsrunit/commit/9fe4dbf9ef0a354aa903d3f0ac76c38507926391))
* **playwright:** support bundled CJS requires in ESM build ([daa0093](https://github.com/letsrunit-hq/letsrunit/commit/daa00932c34a0fc2b660069dceea32b24ecaf477))
* **playwright:** use node-targeted tsup config ([4b3fc4b](https://github.com/letsrunit-hq/letsrunit/commit/4b3fc4b2bca75b30c77475e8a635f8c9b8994054))


### Features

* **cli:** add explain command for latest run failures ([ff81519](https://github.com/letsrunit-hq/letsrunit/commit/ff8151985faea426ac0cc7ab32e56bc5172eabbe))
* **cucumber:** add progress formatter with concise failures ([435f431](https://github.com/letsrunit-hq/letsrunit/commit/435f431d96706dd76d35f6335e1c34a282b6503a))
* **cucumber:** add store plugin and keep formatter as legacy ([84f02b4](https://github.com/letsrunit-hq/letsrunit/commit/84f02b494fef76aab2039b0f4a43cd16603b5968))
* enhance explain command with refine regexp selectors, and update prompt constraints ([3f1b2f3](https://github.com/letsrunit-hq/letsrunit/commit/3f1b2f3dd021fe8839b6cb4ea1c84336d8b6638c))
* **explain:** improve step formatting with colorized symbols ([5161a43](https://github.com/letsrunit-hq/letsrunit/commit/5161a431db13178f17c65eeb8bbed5732e9418b6))
* refactor explain command to runExplain and improve formatting ([64d550d](https://github.com/letsrunit-hq/letsrunit/commit/64d550debd62e1a34344afea4e192bd090bbe474))
* rename store session/run model to run/test ([66b16a6](https://github.com/letsrunit-hq/letsrunit/commit/66b16a6bc2543b74c81da81aa67948b4246a0d62))
* **store:** make rule and outline ids content-addressed ([dbf9127](https://github.com/letsrunit-hq/letsrunit/commit/dbf9127722f222f2e381302af1cd081a761d1e8d))
* **store:** redesign schema with hash IDs and scenario step mapping ([c91abb7](https://github.com/letsrunit-hq/letsrunit/commit/c91abb7eb8410bd1e75e1eb6e0fc877ba89bebbd))
* use JSON examples in explainFailure prompt ([59baf77](https://github.com/letsrunit-hq/letsrunit/commit/59baf77ddbcf182cd2a915c204aa0fc3cbad0ea3))

# [0.10.0](https://github.com/letsrunit-hq/letsrunit/compare/v0.9.1...v0.10.0) (2026-03-31)


### Bug Fixes

* **bdd,mcp-server:** dedupe shared registry steps and dump registry diagnostics ([9781a6f](https://github.com/letsrunit-hq/letsrunit/commit/9781a6f25a258d84a2d074be7ce4d89026113d30))
* **mcp-server:** restore custom cucumber support loading ([637efb6](https://github.com/letsrunit-hq/letsrunit/commit/637efb695020ff830964c6ce3ba80be7bdd1b319))


### Features

* **mcp-server:** add env-gated runtime diagnostics tool ([9eb3ae7](https://github.com/letsrunit-hq/letsrunit/commit/9eb3ae793c3e36d056eba0ce6fa64a6701d3611b))

## [0.9.1](https://github.com/letsrunit-hq/letsrunit/compare/v0.9.0...v0.9.1) (2026-03-28)


### Bug Fixes

* **ci:** use yarn in docs deploy workflow ([930ceb6](https://github.com/letsrunit-hq/letsrunit/commit/930ceb6d364d378c0c3a8ea167041c7cd07179ac))

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
