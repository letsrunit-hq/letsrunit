# GitHub Actions Workflows

## Publish to npm

The `publish.yml` workflow automatically publishes all packages to npm when you push a version tag.

### How it works

1. **Trigger**: Pushing a git tag starting with `v` (e.g., `v0.2.0`)
2. **OIDC Authentication**: Uses GitHub's OIDC token for npm authentication (NO NPM_TOKEN needed!)
3. **Provenance**: Each package gets a verifiable link to the commit and workflow
4. **Trusted Publishing**: npm validates the GitHub OIDC token against configured trusted publishers

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

#### Configure npm Trusted Publishing

You need to configure each package on npm to trust this GitHub repository. See detailed instructions in `.claude/tmp/configure-npm-oidc.md`.

**Quick summary:**

1. **For each package**, visit: `https://www.npmjs.com/package/@letsrunit/PACKAGE_NAME/access`
2. **Add Trusted Publisher**:
   - Provider: `GitHub Actions`
   - Repository: `letsrunit/letsrunit`
   - Workflow: `publish.yml` (or leave empty)
   - Environment: (leave empty)

3. **Repeat for all 10 packages**: utils, gherkin, journal, playwright, mailbox, gherker, bdd, ai, controller, executor

**That's it!** No NPM_TOKEN needed. The workflow uses GitHub's OIDC token automatically.

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

#### Error: "401 Unauthorized" or "403 Forbidden"

**Cause**: Trusted publisher not configured for this package on npmjs.com

**Solution**:
1. Visit `https://www.npmjs.com/package/@letsrunit/PACKAGE_NAME/access`
2. Add GitHub Actions as a trusted publisher (see Setup above)
3. Verify repository name matches exactly: `letsrunit/letsrunit`

#### Error: "OIDC token validation failed"

**Cause**: GitHub OIDC token doesn't match configured publisher

**Solution**:
1. Check repository name is correct (case-sensitive!)
2. Verify workflow filename matches (or is empty in npm config)
3. Ensure `id-token: write` permission is set in workflow

#### Error: "Provenance generation failed"

Make sure the workflow has:
```yaml
permissions:
  id-token: write
```

#### Error: "Version already exists"

You're trying to publish a version that already exists on npm. Bump the version in all package.json files before creating a new tag.

### Security Benefits of OIDC

Compared to using long-lived NPM_TOKEN:

| NPM_TOKEN | OIDC Trusted Publishing |
|-----------|------------------------|
| ❌ Long-lived (months/years) | ✅ Short-lived (minutes) |
| ❌ Can be leaked | ✅ Never leaves GitHub |
| ❌ Manual rotation needed | ✅ Auto-rotated every run |
| ❌ Stored in GitHub Secrets | ✅ No secrets needed |
| ❌ Works from anywhere | ✅ Only works from configured repo/workflow |

The workflow uses **pure OIDC** with no long-lived tokens. GitHub generates a short-lived token for each publish, npm validates it against trusted publishers, and the token expires automatically.
