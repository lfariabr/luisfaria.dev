# "0 updates available" was lying: a security maintenance day on my portfolio

**Tags:** `devops` `security` `docker` `ubuntu`

**27 security alerts, 11 Dependabot PRs, an Ubuntu release that had quietly reached end of support, and a Docker install that stopped updating without telling anyone.**

> *"A pin you add for security is only secure until the next advisory."*

---

## Contents

- [Eleven PRs, one merge](#eleven-prs-one-merge)
- [The five alerts nobody opened a PR for](#the-five-alerts-nobody-opened-a-pr-for)
- [The upgrade that failed on a 404](#the-upgrade-that-failed-on-a-404)
- [The number that lied](#the-number-that-lied)
- [Proving it came back](#proving-it-came-back)
- [Try it yourself](#try-it-yourself)

---

## Eleven PRs, one merge

[luisfaria.dev](https://luisfaria.dev) runs on one DigitalOcean droplet: Next.js, an Express + Apollo GraphQL API, MongoDB and Redis, all in Docker Compose, deployed by GitHub Actions. It's small, and it's the kind of setup where maintenance piles up quietly.

This time the pile was 11 open Dependabot PRs. All green, all mergeable, all lockfile-only except a Next.js bump. Merging them one at a time means 11 lockfile rewrites, 11 CI runs, and 11 commits in the history that say almost nothing.

So I did it once: one branch, `npm install next@^16.3.4` plus a targeted `npm update` for the rest, one full test run per app, one PR ([#289](https://github.com/lfariabr/luisfaria.dev/pull/289)), and the 11 originals closed as superseded. Frontend: 23 suites, 164 tests. Backend: 18 suites, 262 tests. Both builds green.

**So what:** Dependabot opens one PR per package. You don't have to merge them that way.

<sub>[↑ Back to contents](#contents)</sub>

---

## The five alerts nobody opened a PR for

After the push, GitHub replied with this:

```text
GitHub found 27 vulnerabilities on lfariabr/luisfaria.dev's default branch (2 critical, 19 high, 6 moderate).
```

The 11 PRs covered 22 of them. The other five had no PR at all, and the reasons were more interesting than the fixes.

**`qs` (2 alerts).** The fix is in `6.16.0`, but `express@4` and `body-parser@1` both require `~6.15.1`. Dependabot won't propose a version that breaks a parent package's range, so it stayed quiet. Moving to Express 5 would fix it properly, but that's a migration, not a patch. I added an override and wrote Express 5 down as the real fix for later:

```json
"overrides": {
  "qs": "^6.16.0"
}
```

**`immutable` (2 alerts) and `tar` (1 alert).** These were my own fault. My frontend `package.json` already had an `overrides` block pinning both packages to exact versions. I'd added those pins back in March *to fix earlier security alerts*, a prototype-pollution bug in `immutable` and a path-traversal bug in `tar`. The pins did their job then. Once the next advisory came out, they were the only thing keeping the vulnerable version installed:

```diff
-    "immutable": "3.8.3",
-    "tar": "7.5.16",
+    "immutable": "3.8.4",
+    "tar": "7.5.22",
```

After that, `npm audit` reported 0 vulnerabilities in both apps, and the Dependabot alert count went from 27 to 0.

**So what:** an exact pin is a decision with no expiry date. When you pin something for security, also plan when you'll check the pin again. Otherwise the fix itself becomes the next vulnerability.

<sub>[↑ Back to contents](#contents)</sub>

---

## The upgrade that failed on a 404

The droplet's login banner had its own news:

```text
Your Ubuntu release is not supported anymore.
New release '26.04.1 LTS' available.
```

25.10 is an interim release with about nine months of support, and those nine months had run out. So: take a snapshot, run the upgrade inside `tmux` so a dropped SSH connection can't kill it halfway, then `do-release-upgrade`.

It failed straight away:

```text
Could not find the release announcement
The server may be overloaded.
```

A retry failed the same way. Rather than keep retrying, I checked each URL the upgrader fetches. The release list returned 200. Then:

```text
resolute-updates/ReleaseAnnouncement: 404
resolute-updates/resolute.tar.gz:     200
resolute/ReleaseAnnouncement:         200
resolute/resolute.tar.gz:             200
```

The upgrader existed. Only its announcement file was missing, and `do-release-upgrade` refuses to continue without it. The fix was to run the same signed upgrader manually, after verifying the signature:

```bash
gpgv --keyring /usr/share/keyrings/ubuntu-archive-keyring.gpg resolute.tar.gz.gpg resolute.tar.gz
tar xzf resolute.tar.gz && ./resolute --frontend=DistUpgradeViewText
```

It upgraded 665 packages, installed 46, removed 1 (`packagekit-tools`, after I checked the details list to make sure it wasn't Docker), and rebooted onto 26.04.1 LTS with kernel 7.0.

**So what:** "the server may be overloaded" was a guess by the error message. Checking what each URL actually returned showed the real problem in two minutes.

<sub>[↑ Back to contents](#contents)</sub>

---

## The number that lied

With the OS upgraded, the banner said `0 updates can be applied immediately`. Then I looked at Docker:

```text
docker-ce 5:28.4.0-1~ubuntu.24.10~oracular
containerd.io 1.7.27-1
docker-compose-plugin 2.39.2-1~ubuntu.24.10~oracular
```

Those were Ubuntu **24.10** builds, running on a server that had just been upgraded from 25.10. There was no Docker file in `/etc/apt/sources.list.d/` at all. At some point in an earlier release upgrade, Docker's apt source had been dropped, and since then apt had honestly reported 0 updates, because it no longer knew Docker had any.

After restoring the repo for `resolute`, the list of pending Docker updates looked like this:

| Package | Installed | Available |
|---|---|---|
| Docker Engine | 28.4.0 | **29.8.1** |
| containerd | 1.7.27 | **2.3.5** |
| Compose | 2.39.2 | **5.5.1** |

Those are major-version jumps, so before upgrading I checked the compose file and deploy workflow. Both use `docker compose` (v2 syntax), images from registries, and named volumes, so nothing depended on the old behaviour.

**So what:** "0 updates" only covers the repos apt still knows about. Release upgrades disable third-party repos, and it's easy to never turn them back on. After an OS upgrade, check where your important packages come from, not just whether apt says there's anything to install.

<sub>[↑ Back to contents](#contents)</sub>

---

## Proving it came back

The rollback options were in place before each risky step: the droplet snapshot before the OS upgrade, and a `mongodump` before the Docker upgrade. The snapshot pre-dated the OS upgrade, so restoring it would have undone that too. The dump was the cheaper safety net.

After the upgrades I checked more than one signal:

- `systemctl --failed` was empty
- all 5 containers were `Up`
- the site returned 200
- a GraphQL `articles` query returned real article titles

A 200 only proves nginx is up. Real rows coming back through the API proves MongoDB and its data made it through the upgrade too.

**So what:** "it's up" and "it works" are different claims. Check the one your users actually depend on.

<sub>[↑ Back to contents](#contents)</sub>

---

## Try it yourself

- **The repo:** [github.com/lfariabr/luisfaria.dev](https://github.com/lfariabr/luisfaria.dev)
- **The consolidation PR:** [PR #289](https://github.com/lfariabr/luisfaria.dev/pull/289)
- **The release:** [v3.17.0](https://github.com/lfariabr/luisfaria.dev/releases/tag/v3.17.0)

Next on the list is MongoDB 4.4, which has been out of support since early 2024 and can only be upgraded one major version at a time. When did you last check which of *your* exact pins still make sense?

---

## Let's connect

- **GitHub:** [github.com/lfariabr](https://github.com/lfariabr)
- **LinkedIn:** [linkedin.com/in/lfariabr](https://www.linkedin.com/in/lfariabr/)
- **Portfolio:** [luisfaria.dev](https://luisfaria.dev)

*Measure the URL, not the error message - and check your pins before the next advisory does.*
