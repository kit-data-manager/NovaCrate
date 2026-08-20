# 📦 NovaCrate - RO-Crate Editor

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.15183573.svg)](https://doi.org/10.5281/zenodo.15183573)
[![Build and Push Docker Image](https://github.com/kit-data-manager/NovaCrate/actions/workflows/docker.yml/badge.svg)](https://github.com/kit-data-manager/NovaCrate/actions/workflows/docker.yml)
[![Playwright Tests](https://github.com/kit-data-manager/NovaCrate/actions/workflows/playwright.yml/badge.svg)](https://github.com/kit-data-manager/NovaCrate/actions/workflows/playwright.yml)
[![Node.js CI](https://github.com/kit-data-manager/NovaCrate/actions/workflows/build.yml/badge.svg)](https://github.com/kit-data-manager/NovaCrate/actions/workflows/build.yml)

Web-based fully-featured interactive editor for **creating, editing, and visualizing** research object crates. Built for inspecting, validating, and manipulating RO-Crates, allowing you to get a deeper understanding of its content and structure.

NovaCrate is in active development; we welcome feedback, feature requests, and bug reports on the [issues page](https://github.com/kit-data-manager/NovaCrate/issues).

## [▶️ Open NovaCrate](https://novacrate.datamanager.kit.edu/)

<details>
<summary>Where is my data stored?</summary>
  
All data is stored in your browser's [Origin private file system (OPFS)](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system). It will never leave your browser nor your device. No data is stored on our servers.

For more information, see our  [privacy policy](https://www.kit.edu/privacypolicy.php).
</details>

[Documentation on deploying NovaCrate](./docs/deployment.md)

## 🚀 Features

- 🛠️ **Create, read, and edit RO-Crates**
- ✨ **Integrated AI Assistant (Optional)** to help you create, maintain, and understand RO-Crates
  - ➡️ Use your own subscription from OpenAI, Anthropic, or OpenRouter
  - ➡️ You can also use a custom OpenAI-compatible LLM provider (e.g. Open WebUI)
  - ➡️ The AI Assistant can create, read, update and delete metadata, and it can read plain files in your RO-Crate
- 🐞 Live **validation** of RO-Crates
- 🔬 Visualize RO-Crates with a graph
- 🗒️ Support for importing and exporting the ELN format
- ✅ RO-Crate context information and property descriptions
- ✅ Automatic recommendation of fitting entity types and properties
- ✅ Extensible with custom schemas at runtime
- ✅ Generate and view an HTML preview file

## 🎨 Editions

NovaCrate can be used and deployed in multiple different ways. Currently, two editions are available:
- Standalone Web App [(Open)](https://novacrate.datamanager.kit.edu/)
- Embedded Mode [(Docs)](docs/iframe-interface.md)

> 💡 If you have a special interest in NovaCrate as a Desktop App or the Cloud Frontend, please get in contact.

<details>
<summary>Details on NovaCrate Editions</summary>

| Name               | Status  | Description                                                                                                                                                                                                             | Notes                                                                                                                                                                                                                                                        |
|--------------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Standalone Web App | Active  | Standalone Web App without a backend. Stores Crates in the local origin-private file system of the browser                                                                                                              | [Access here](https://novacrate.datamanager.kit.edu/)                                                                                                                                                                                                        |
| Embedded Mode      | Active  | NovaCrate can be embedded as an IFrame and controlled by its parent page. This allows you to integrate NovaCrate as a RO-Crate inspector and editor in your own applications.                                           | [Access the IFrame documentation here](docs/iframe-interface.md)                                                                                                                                                                                             |
| Desktop App        | Concept | Tauri App with a local backend. Has full access to file system and can make use of arbitrary backend software.                                                                                                          | Successful demonstration has been developed in the past, but is no longer maintained. See the lib persistence overview in the row below for details.                                                                                                         |
| Cloud Frontend     | Concept | NovaCrate is a frontend that can be used with any compatible backend solution, for example a cloud based service that hosts RO-Crates. This approach has not been explored yet due to lack of viable backend solutions. | See the [lib persistence overview image](./docs/figures/lib/lib-persistence.png) or `lib/core/persistence` for interfaces that have to be implemented by the backend. Only IPersistenceService and ICrateService are required for a minimal working backend. |

</details>

### ℹ️ How To: Custom Backend

NovaCrate is modular and can be used with any backend solution. See the [lib persistence overview image](./docs/figures/lib/lib-persistence.png) or `lib/core/persistence` for interfaces that have to be implemented by the backend. To use NovaCrate with your own backend implementation, fork this repository and swap out the backend implementation in the [persistence provider](components/providers/persistence-provider.tsx).

NovaCrate currently does not include mechanisms for authentication, access control or concurrent access.

## 🚀 Deploying

Deploying NovaCrate is easy. Go to the [Deployment Documentation](./docs/deployment.md). If you don't need to customize NovaCrate, then you can just use the [Official Instance](https://novacrate.datamanager.kit.edu/).

## 👨‍💻 Development

### Prerequisites

- Install Node.js >= 22
- Clone the NovaCrate repository

### Quickstart

Once the prerequisites are met, run the following code to get started quickly:

```bash
npm install
npm run dev
```

Optional configuration is done via a `.env` file (see `.env.example`). For example,
`SCHEMA_FETCH_ALLOWED_URLS` restricts which vocabulary hosts the schema fetch API may
contact; it defaults to the hosts of the built-in schemas, so no configuration is
required to get started.

### Updating dependencies

This step might be necessary after fetching new commits and on the first installation.

```bash
npm install
```


### Development

This command starts NovaCrate in development mode. This enables hot reload but also increases response time.

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

### Testing

NovaCrate ships with end-to-end frontend tests that can be used to verify that the core functionality is working as expected. At the current time, the test coverage is relatively low
due to the complexity of UI-based testing.

You can run the tests using:

    npm run build && npm run serve
    # In a different terminal:
    npm run test:e2e

Unit tests can be run without building the app using:

    npm run test:unit

On development machines, the entire test suite incorporating E2E tests and unit tests can be run using:

    npm run test:dev-all

## ℹ️ Documentation

There is limited technical documentation available in the `docs` folder (WIP). 

There is currently no usage documentation available, but we hope that the editor is easy to use and understand nonetheless.

## 📨 Contact

NovaCrate is being developed at the [Data Exploitation Methods](https://www.scc.kit.edu/en/aboutus/dem.php) Group of the [Scientific Computing Center](https://scc.kit.edu/) at [Karlsruhe Institute of Technology (KIT)](https://kit.edu). Feel free to contact us for any questions or feedback through the contact details available in the `codemeta.json` file.
