# NovaCrate

New easily usable research object crate editor.

[[_TOC_]]

## Installation

### Prerequisites

- Make sure [ro-crate-rest](https://gitlab.kit.edu/kit/scc/dem/dem-students/ChristopherR/implementation/ro-crate-rest) is running
- Install Node.js >= 20
- Close the NovaCrate repository

### Updating dependencies

This step might be necessary after fetching new commits.

```bash
npm install
```


### Development

This command starts NovaCrate in development mode. This enabled hot reload, but also increases response time

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building

This command builds NovaCrate in the `out` folder.

```bash
npm run build
```

The website can then be found in the `out` folder. Use any web server for viewing. Local viewing:

```bash
npx serve@latest out
```

## Structure

Most of the structure of the editor and many implementation and design details are outlined in the bachelors thesis.

To summarize: This is a Next.js app. Pages are located in /app, components in /components and anything else is probably in /lib


## Tauri Integration

Initial tests with tauri, to turn NovaCrate into a desktop app, were successful. Sources can be found in the src-tauri folder.
