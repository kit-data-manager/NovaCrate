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

- ✅ Create, read, and edit RO-Crates
- ✅ Live validation of RO-Crates
  - ⚙️ Supports validation of the RO-Crate Specification v1.1 and v1.2
  - 🏗️ Easily extensible to validate profiles or specific RO-Crate types (e.g., Workflow crates)
  - 🚀 Autofix actions available for some issues
- ✅ Visualize RO-Crates with a graph
- ✅ Focused on usability and modern architecture
- ✅ Context-information and property descriptions
- ✅ Automatic recommendation of fitting entity types and properties
- ✅ Support for importing and exporting the ELN format
- ✅ Extensible with custom schemas at runtime
- ✅ Generate and view an HTML preview file

## 🎨 Editions

NovaCrate can be used and deployed in multiple different ways. Currently, only the web version is in active development.
You can access it directly [here](https://novacrate.datamanager.kit.edu/).

> 💡 If you have a special interest in the Desktop App or the Cloud Frontend, please get in contact.

<details>
<summary>Details on NovaCrate Editions</summary>

| Name               | Status  | Description                                                                                                                                                                                                             | Notes                                                                                                      |
|--------------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Standalone Web App | Active  | Standalone Web App without a backend. Stores Crates in the local origin-private file system of the browser                                                                                                              | [Access here](https://novacrate.datamanager.kit.edu/)                                               |
| Desktop App        | Concept | Tauri App with a local backend. Has full access to file system and can make use of arbitrary backend software.                                                                                                          | Suitable backend already implemented.                                                                      |
| Cloud Frontend     | Concept | NovaCrate is a frontend that can be used with any compatible backend solution, for example a cloud based service that hosts RO-Crates. This approach has not been explored yet due to lack of viable backend solutions. | See `src/lib/backend/CrateServiceAdapter.d.ts` for a list of methods that a backend adapter should implement |

### ℹ️ How To: Custom Backend

NovaCrate is a frontend that can be used for any backend that hosts RO-Crates (an appropriate backend adapter must be implemented). This could be anything in the range from a simple file storage to a full REST Service for manipulating crates.
See `src/lib/backend/CrateServiceAdapter.d.ts` for a list of methods that a backend adapter should implement. All of these methods can make use of backend resources or be supplemented locally.

NovaCrate currently does not include mechanisms for authentication, access control or concurrent access.
</details>

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
    npm run test

## ℹ️ Documentation

There is limited technical documentation available in the `docs` folder (WIP). 

There is currently no usage documentation available, but we hope that the editor is easy to use and understand nonetheless.

## 📨 Contact

NovaCrate is being developed at the [Data Exploitation Methods](https://www.scc.kit.edu/en/aboutus/dem.php) Group of the [Scientific Computing Center](https://scc.kit.edu/) at [Karlsruhe Institute of Technology (KIT)](https://kit.edu). Feel free to contact us for any questions or feedback through the contact details available in the `codemeta.json` file.
