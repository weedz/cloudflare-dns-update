# cloudflare-dns-update

## Systemd unit

Install a timer `.config/systemd/user/cloudflare-dns-update.timer`:

```systemd
[Unit]
Description=Update DNS records
 
[Timer]
# Run the service every minute
OnCalendar=*-*-* *:*:00
OnBootSec=5min
 
[Install]
WantedBy=timers.target
```

And a service `.config/systemd/user/cloudflare-dns-update.service`:

```systemd
[Unit]
Description=Update DNS records

[Service]
WorkingDirectory=%h/cloudflare-dns-update
# ExecStart=node --env-file=.env dist/main.js
# Environment and full path to node is only needed if you use `n` node version manager
Environment="PATH=/home/pi/.local/n/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games" "N_PREFIX=/home/.local/n"
ExecStart=/home/pi/.local/n/bin/node --env-file=.env dist/main.js
```

Enable with:

```console
systemd --user start cloudflare-dns-update.timer
systemd --user enable cloudflare-dns-update.timer
```
