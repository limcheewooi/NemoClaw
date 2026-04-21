# v<VERSION> — <short title> (<YYYY-MM-DD HH:MM>)

**Version:** <VERSION>
**Stage tags:** v<VERSION>-dev, v<VERSION>-test, v<VERSION>-live, v<VERSION>
**Branch flow:** dev → test → live → main
**Author:** <github-handle>

## Background

Why this change exists. What problem, constraint, or stakeholder request drove it. What was the state before this release.

## Reason

The specific trigger for this release (bug, feature request, upstream drift, operational incident, scheduled work). One or two paragraphs.

## Changes

File-level list of what changed and why.

- `path/to/file.ext` — what and why
- Config / env / flag changes, if any
- Breaking changes — called out explicitly

## Smoke test results

Fast, targeted checks proving the change works in the happy path.

- [x] <command or scenario> → <expected> → <observed>
- [ ] Pending — <reason>

## Regression test results

Proof that nothing previously-working broke.

- [x] `npm test` — pass/fail on commit <SHA>
- [x] `make check` — pass/fail
- [x] Manual regression — <scenario> → <result>

## Rollback

Exact commands to fully revert this release.

```bash
# 1. Delete stage tags (local + origin)
for t in v<VERSION> v<VERSION>-live v<VERSION>-test v<VERSION>-dev; do
  git tag -d "$t" 2>/dev/null || true
  git push origin ":refs/tags/$t" 2>/dev/null || true
done

# 2. Reset branches to the pre-release commit <PREV_SHA>
for b in dev test live main; do
  git checkout "$b"
  git reset --hard <PREV_SHA>
  git push --force-with-lease origin "$b"
done

# 3. Any out-of-band cleanup (cache, deployed artifact, config)
# - <describe>
```

Include any non-git rollback steps (cache invalidation, deployed artifact removal, config rollback, user notification).
