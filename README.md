# 📦 NovaCrate - RO-Crate Editor

Web-based fully-featured interactive editor for **creating, editing, and visualizing** research object crates. Built for inspecting, validating, and manipulating RO-Crates, allowing you to get a deeper understanding of its content and structure.

NovaCrate is in active development; we welcome feedback, feature requests, and bug reports on the [issues page](https://github.com/kit-data-manager/NovaCrate/issues).

## [▶️ Open NovaCrate](https://kit-data-manager.github.io/NovaCrate/)

<details>
<summary>⚠️ There are two public instances</summary>

Note that there are currently two public instances of NovaCrate:
- On GitHub Pages at [kit-data-manager.github.io/NovaCrate/](https://kit-data-manager.github.io/NovaCrate/)
- On our own servers at [novacrate.datamanager.kit.edu](https://novacrate.datamanager.kit.edu/)

The crates you open and create on each instance are not shared between the instances, so you will have to return to the correct instance to see your recent crates.
We can't guarantee that both instances will always be available. Make sure to download your work before leaving the app.

All data you use in NovaCrate is exclusively stored in your browser's local storage and therefore cannot be transferred to other instances.
</details>

<details>
<summary>Where is my data stored?</summary>
All data is stored in your browser's local storage (origin-private file system).
</details>

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
You can access it directly [here](https://kit-data-manager.github.io/NovaCrate/).

> 💡 If you have a special interest in the Desktop App or the Cloud Frontend, please get in contact.

<details>
<summary>Details on NovaCrate Editions</summary>

| Name               | Status  | Description                                                                                                                                                                                                             | Notes                                                                                                      |
|--------------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Standalone Web App | Active  | Standalone Web App without a backend. Stores Crates in the local origin-private file system of the browser                                                                                                              | [Access here](https://kit-data-manager.github.io/NovaCrate/)                                               |
| Desktop App        | Concept | Tauri App with a local backend. Has full access to file system and can make use of arbitrary backend software.                                                                                                          | Suitable backend already implemented.                                                                      |
| Cloud Frontend     | Concept | NovaCrate is a frontend that can be used with any compatible backend solution, for example a cloud based service that hosts RO-Crates. This approach has not been explored yet due to lack of viable backend solutions. | See `src/lib/backend/CrateServiceAdapter.d.ts` for a list of methods that a backend adapter should implement |

### ℹ️ How To: Custom Backend

NovaCrate is a frontend that can be used for any backend that hosts RO-Crates (an appropriate backend adapter must be implemented). This could be anything in the range from a simple file storage to a full REST Service for manipulating crates.
See `src/lib/backend/CrateServiceAdapter.d.ts` for a list of methods that a backend adapter should implement. All of these methods can make use of backend resources or be supplemented locally.

NovaCrate currently does not include mechanisms for authentication, access control or concurrent access.
</details>

## 👨‍💻 Development

### Prerequisites

- Install Node.js >= 20
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

## 🎓 Thesis

This project was first created as part of a [bachelor thesis](https://doi.org/10.5445/IR/1000178790)

## ℹ️ Structure

Most of the structure of the editor and many implementation and design details are outlined in the bachelor thesis.

To summarize: This is a Next.js app. Pages are located in /app, components in /components, and anything else is probably in /lib.

## 📸 Screenshots

> Note: These screenshots are out of date.

![](docs/teaser.png)
![](docs/teaser2.png)
![](docs/teaser3.png)
