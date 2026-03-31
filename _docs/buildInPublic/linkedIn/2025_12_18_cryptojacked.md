My Next.js portfolio app got cryptojacked last week, and the attacker left a hilariously unprofessional message in the logs 😅 (check the screenshot!)

What started as weird error digests ended up being a full cryptomining attack, where automated bots exploited a vulnerability in my code that allowed remote command execution, then deployed miners that happily used my container’s CPU for hours.

Early warning signs:
- Strange logs (yes, including that one)
- Application timeouts and sluggish responses
- Unknown binaries and dozens of zombie shell processes

The good news? Docker did its job perfectly. The malware was fully contained inside the container: no host access, no persistence, no lateral movement.

Still, any code execution is bad news and I immediately shut everything down, rebuilt from a clean state, rotated secrets, and kicked off a proper security hardening sprint. The root cause? Classic mistake: unsanitized user input being executed directly. Lesson learned the hard way!

I wrote a detailed post-mortem with logs, attacker IPs, malware analysis, and prevention tips in case it helps anyone else:
https://lnkd.in/giCQ9ydW

Building in public means sharing the wins and the scars. 
Back online and more secure than ever!

Have you ever dealt with cryptominers or unexpected attacks on your apps? Curious to learn from your stories!

hashtag#BuildInPublic hashtag#Nextjs hashtag#Docker hashtag#WebSecurity hashtag#CyberSecurity