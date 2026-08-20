# Deploying NovaCrate

NovaCrate is a Next.js application that must be hosted on a server to be accessible from a web browser. You can either use the hosted version at [novacrate.datamanager.kit.edu](https://novacrate.datamanager.kit.edu/), but you can also host an instance of NovaCrate yourself. This is required if you want to use IFrame integration.

## Deploying with Docker

To run NovaCrate with Docker, you can use the official NovaCrate image from the [GitHub Container Registry](https://github.com/kit-data-manager/NovaCrate/pkgs/container/novacrate). NovaCrate is reachable on port 3000.

If you wish to change any of the environment variables, then you have to build NovaCrate from source ([With Docker](#building-from-source-docker) or [Without Docker](#deploying-manually-without-docker)).

### Building from Source (Docker)

1. Clone the NovaCrate repository
2. In [docker-compose.build.yml](/docker-compose.build.yml): Remove the line comments and set the environment variables (all of them are optional, only set those you need)
3. Build the image: `docker compose -f docker-compose.yml -f docker-compose.build.yml build`
4. Run using your own docker compose or by adapting the default [docker-compose.yml](/docker-compose.yml).

## Deploying manually (without Docker)

You can run NovaCrate without Docker on any modern operating system where Node.js 20+ is installed. Clone the NovaCrate repository and run the following commands. Note that you need to set [Environment Variables](#environment-variables) before the build step.

```bash
npm install
npm run build
npm run start
```

NovaCrate is then accessible on port 3000.

## Environment Variables

Note that when you configure any of these variables, you need to extend the NovaCrate Docker image or build NovaCrate from source. Changing these environment variables on the docker image at runtime is not possible.

| Variable Name               | Default Value | Description                                                                                                                                        |
|-----------------------------|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| BASE_PATH                   | *empty*       | Base path of the application                                                                                                                       |
| IFRAME_TARGET_ORIGIN        | *empty*       | Required for using NovaCrate in IFrame embedded mode. Refer to the [IFrame Documentation](./iframe-interface.md)                                   |
| AI_ASSISTANT_ENABLED        | *empty*       | Set this to `true` to enable the AI Assistant in your deployment.                                                                                  |
| AI_ASSISTANT_BASE_URL_REGEX | *empty*       | Regex that matches allowed custom base URLs configured by the user for an LLM provider. Custom base URLs are disabled if this variable is not set. |
| SCHEMA_FETCH_ALLOWED_URLS   | *secure default* | Whitespace- or comma-separated glob patterns for the URLs the schema fetch API is allowed to request. Defaults to the hosts of the built-in schemas (schema.org, bioschemas.org, dublincore.org, w3.org, raw.githubusercontent.com, pcdm). Set this to restrict or extend which vocabularies can be downloaded. |

### Attention: AI Assistant security considerations

Chat requests from the AI Assistant are routed through NovaCrate API routes to the LLM provider. If the user has configured a custom base URL for the LLM provider, NovaCrate will attempt to send requests there (only if permitted by AI_ASSISTANT_BASE_URL_REGEX).
If you allow custom base URLs, make sure that users do not gain unintended access to private resources within your network.

### Attention: Schema fetching security considerations

When the user enables "Allow unknown schemas", any vocabulary term that is not covered by a registered schema is fetched directly from its host. These requests are made by the NovaCrate server through `/api/schemas/fetch` and are restricted to the hosts matching `SCHEMA_FETCH_ALLOWED_URLS`; requests to other hosts are rejected with HTTP 403. The default allowlist covers the built-in schema hosts, which is sufficient for the default setup. Only extend the allowlist if you trust the vocabulary hosts you add. Bundled schemas that ship with NovaCrate are served locally and never fetched over the network.
