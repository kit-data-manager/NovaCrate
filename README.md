# NovaCrate

New easily usable research object crate editor.

## Web App

### Prerequisites

- Make sure [ro-crate-rest](https://gitlab.kit.edu/kit/scc/dem/dem-students/ChristopherR/implementation/ro-crate-rest) is running
- Node.js >= 20

### Updating dependencies

```bash
npm install
```


### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building

```bash
npm run build
```

The website can then be found in the `out` folder. Use any web server for viewing. Local viewing:

```bash
npx serve@latest out
```

## Desktop App

A simple [tauri](https://tauri.app/) wrapper is used to produce a desktop version. **Optional**, not required for the web app.

### Prerequisites
 
- All Prerequisites of the Web App
- Rust Toolchain
- `tauri-cli` installed via cargo

### Development

```bash
cd src-tauri && cargo tauri dev
```

### Build

```bash
cd src-tauri && cargo tauri build
```