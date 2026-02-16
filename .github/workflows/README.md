# GitHub Actions Workflows

## Publish to npm

Automatically publishes all packages to npm when you push a version tag.

### Usage

```bash
# 1. Update version in all packages
# 2. Commit and tag
git add .
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push origin main --tags
```

The workflow will:
- Build all packages
- Publish each package in parallel with provenance
- Create a GitHub Release

### Setup

Configure npm trusted publishing for each package:

1. Visit `https://www.npmjs.com/package/@letsrunit/PACKAGE_NAME/access`
2. Add trusted publisher:
   - Provider: GitHub Actions
   - Repository: `letsrunit/letsrunit`
   - Workflow: `publish.yml`

Repeat for all packages. See `.claude/tmp/configure-npm-oidc.md` for links.

### Troubleshooting

**401 Unauthorized**: Configure trusted publisher on npmjs.com (see Setup)

**Version already exists**: Bump version in package.json files before tagging
