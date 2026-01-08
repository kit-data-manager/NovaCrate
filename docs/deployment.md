# Deploying NovaCrate

NovaCrate is a Next.js application that must be hosted on a server in order to be accessible from a web browser. You can either use the hosted version at [novacrate.datamanager.kit.edu](https://novacrate.datamanager.kit.edu/), but you can also host an instance of NovaCrate yourself. Note that up to now (v1.5) there are no configurable server-side capabilities to NovaCrate, so there will be no functional difference between the officially hosted versions and a custom one.

### Docker

To run NovaCrate with Docker, you can simply use the official NovaCrate image from the GitHub Container Registry: `docker pull ghcr.io/kit-data-manager/novacrate:latest`. NovaCrate is reachable on port 3000.

You can also extend the Dockerfile in this repository to adjust the image.

### Manual

You can easily run NovaCrate without Docker on any modern operating system where Node.js 20+ is installed. Simply clone the repository and run the following commands:

```bash
npm install
npm run build
npm run start
```

NovaCrate is then accessible on port 3000.