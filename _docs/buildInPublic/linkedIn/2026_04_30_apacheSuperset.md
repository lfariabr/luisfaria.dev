# LinkedIn Post — Apache Superset: Open-Source Data Visualization for Business Intelligence

I deployed Apache Superset on Microsoft Azure with:
 - Resource Group
 - VNet + subnet
 - Network Security Group
 - Ubuntu VM
 - Docker Compose
 - Superset + PostgreSQL + Redis

My CCF501 Assessment 3 brief suggested apps like Moodle, ThingsBoard,
KaaIoT, or Atlassian's Jira. I chose Apache Superset instead.

The useful part wasn’t the clean architecture diagram

It was the deployment friction:

1. The free-tier VM was too small. Port 8088 had to be opened intentionally.
 SSH on 22 stayed restricted to my IP. Everything else inbound stayed denied;
2. Superset had to prove it was more than a login screen: uploaded CSVs, a working dashboard, and Admin / Alpha / Gamma RBAC roles;
3. I repeated the stack on AWS EC2 and hit different problems: dnf instead of apt, Docker Compose not bundled, and browser access to 8088 timing out until I used an SSH tunnel.

Architecture diagrams show the intent.
Deployment shows what we actually understand.

If you're curious about the details, the full write-up + deployment notes are in the comments.

#CloudComputing #ApacheSuperset #DevOps
