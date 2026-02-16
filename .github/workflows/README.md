# GitHub Actions Workflows

## Publish to npm

The `publish.yml` workflow automatically publishes all packages to npm when you push a version tag.

### How it works

1. **Trigger**: Pushing a git tag starting with `v` (e.g., `v0.2.0`)
2. **OIDC**: Uses GitHub's OIDC to generate signed provenance attestations
3. **Provenance**: Each package gets a verifiable link to the commit and workflow
4. **Authentication**: Uses `NPM_TOKEN` secret for npm authentication

### Usage

```bash
# 1. Update version in all packages (use changesets or manual)
# 2. Commit changes
git add .
git commit -m "chore: release v0.2.0"

# 3. Create and push tag
git tag v0.2.0
git push origin main --tags
```

The workflow will automatically:
- ✅ Build all packages
- ✅ Publish to npm with provenance
- ✅ Create a GitHub Release
- ✅ Generate release notes

### Setup Required

#### 1. Create NPM Token

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Generate New Token → **Automation Token**
3. Copy the token

#### 2. Add to GitHub Secrets

1. Go to your repo → Settings → Secrets and variables → Actions
2. New repository secret:
   - Name: `NPM_TOKEN`
   - Value: [paste your token]

#### 3. Enable OIDC (Already configured)

The workflow already has `id-token: write` permission, which enables OIDC.

### What is Provenance?

When packages are published with `--provenance`, npm creates a signed attestation that includes:
- 📝 The exact commit SHA that was built
- 🔄 The GitHub Actions workflow that published it
- 👤 Who triggered the workflow
- 🔐 Cryptographic signature from GitHub

This appears on the npm package page as:
```
✓ Provenance
  Published from GitHub Actions
  View transparency log
```

Users can verify:
```bash
npm audit signatures
```

### Viewing Provenance

After publishing, you can see provenance at:
- https://www.npmjs.com/package/@letsrunit/executor
- Click on "Provenance" section
- See the commit, workflow, and build details

### Security Benefits

1. **Supply Chain Security**: Prove packages weren't tampered with
2. **Build Transparency**: Anyone can verify what commit produced the package
3. **No Long-Lived Secrets**: OIDC tokens are short-lived (minutes, not months)
4. **Audit Trail**: Complete history of who published what and when

### Troubleshooting

#### Error: "Provenance generation failed"

Make sure the workflow has:
```yaml
permissions:
  id-token: write
```

#### Error: "NPM_TOKEN not found"

Add the token to GitHub Secrets (see Setup above)

#### Error: "Version already exists"

You're trying to publish a version that already exists on npm. Bump the version in all package.json files before creating a new tag.

### Future: Pure OIDC (No NPM_TOKEN)

npm is working on full OIDC authentication where you won't need NPM_TOKEN at all. When available, we'll update the workflow to:
```yaml
- run: npm publish --provenance
  # No NODE_AUTH_TOKEN needed!
```

For now, we use the hybrid approach: NPM_TOKEN for auth + OIDC for provenance.
