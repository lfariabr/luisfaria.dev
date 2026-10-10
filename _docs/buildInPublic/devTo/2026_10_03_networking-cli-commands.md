# Port 8088 timed out: the networking CLI commands I actually reach for

**Tags:** `networking` `cli` `devops` `beginners`

<!--
Draft status: skeleton, write after ITW601 A1 (11 Oct).
Rules:
- public stories only: Apache Superset (AWS EC2 only, no Azure), DigitalOcean droplet, Render cold start;
- run every command against my own public apps, paste real output;
- no employer hosts, proxies, certificates or infrastructure;
- no em dashes;
- remove this comment before publishing.
Sources: linkedIn/2026_04_30_apacheSuperset.md, devTo/2026_03_30_apache-superset-deployment.md
-->

## The port that would not answer

<!-- Superset on EC2: 8088 timing out in the browser until an SSH tunnel. What I did by instinct vs what the course gave names to. -->

## Is it DNS?

<!-- dig, nslookup. Example against luisfaria.dev. -->

## Is anything listening?

<!-- ss -tlnp / lsof -i :8088 on the box, nc -zv from outside. Listening locally vs reachable remotely. -->

## What is the HTTP conversation?

<!-- curl -v and curl -I. Reading status, headers, redirects. Render cold start timing with curl -w. -->

## Is TLS the problem?

<!-- openssl s_client -connect host:443 -servername host. Expiry, chain, SNI. -->

## When the firewall is right and you still can't reach it

<!-- ssh -L 8088:localhost:8088 user@host. Why the tunnel worked: security group / NSG vs host firewall. -->

## Letting an agent run these for you

<!-- CLI agents run these commands quickly. What I check before trusting the output: which host, which interface, read-only first. -->

## Try it yourself

<!-- Short checklist of the commands in order. Link to the Superset article. -->
