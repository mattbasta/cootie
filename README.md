# Cootie

Cootie is a tool for easily running a VPS with multiple Node servers. In a
normal environment, adding a new project involves many steps: cloning the
project, writing nginx configuration, setting up a daemonizer, etc. To top it
off, your VPS probably didn't come pre-loaded with nginx, so you had to go
through multiple install processes to get the environment set up.

Cootie allows you to manage all of your applications centrally:

```bash
cd /opt
git clone git@github.com:mattbasta/mygreatwebsite.git

# cootie add [path to server] [port] [hostname[, hostname ...]]
cootie add /opt/mygreatwebsite/app.js 8001 greatsite.biz

# If you've never run Cootie before
forever start cootie

# If you already have Cootie set up
forever restartall
```


## Things Cootie is not

- **A replacement for nginx.** Cootie isn't built for speed.
- **Production ready.** I wouldn't trust Cootie to bear the burden of a
  production website.
- **Magic.** Cootie wraps multiple libraries and supplies much of the glue code
  for building a stable platform. Cootie does little more than that.

