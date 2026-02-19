# IFrame Interface

NovaCrate can be embedded into other frontends using the HTML-5 `<iframe>` tag. Limitations apply.

## Integration

To use NovaCrate in Iframe mode, you must host an instance of NovaCrate yourself. Iframe integration is disabled in the official instance for safety reasons. To enable Iframe integration
in your own instance, set the environment variable `IFRAME_TARGET_ORIGIN`. Set this variable to the origin of the parent page as described in the [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#targetorigin) documentation.
Example with docker compose:

```yaml
services:
  novacrate:
    image: ghcr.io/kit-data-manager/novacrate:1
    environment:
     - IFRAME_TARGET_ORIGIN=https://your-parent-page.org
```

Then, add the following HTML snippet to your page:

```html
<iframe src="https://your-novacrate-instance.org/editor/iframe/entities" width="1200" height="800" />
<!--                                                    ^^^^^^ This enables Iframe mode           -->
```

Note the additional `iframe` segment in the URL.

Iframe integration is only enabled when both the `IFRAME_TARGET_ORIGIN` environment variable and the `iframe` URL segment are present as described.

## Limitations

Currently, the Iframe mode of NovaCrate is limited to metadata editing. All file and folder management capabilities that are present in standalone NovaCrate are disabled.
If file management is a feature you need in Iframe mode, please get in contact.

The Iframe mode of NovaCrate is locked down to only the crate loaded into the editor by the parent page. Users will not have access to their other crates they have used
on your NovaCrate instance. They will also not be able to access the main menu or create a new crate. Instead, a crate must be provided by the parent page initially. If this limitation is a problem for you,
please get in contact.

## Message Interface (v1)

Communication between the embedding page (parent page) and NovaCrate is done via the [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API. The following
messages can be exchanged between the two pages.

| Direction           | Type                 | Description                          |                             |
|---------------------|----------------------|--------------------------------------|-----------------------------|
| Parent <- NovaCrate | `READY`              | Sent when NovaCrate is ready         | [Link](#READY)              |
| Parent <- NovaCrate | `CRATE_CHANGED`      | Sent when user saves changes         | [Link](#CRATE_CHANGED)      |
| Parent <- NovaCrate | `GET_CRATE_RESPONSE` | In response to `GET_CRATE`           | [Link](#GET_CRATE_RESPONSE) |
| Parent -> NovaCrate | `LOAD_CRATE`         | To load a crate into NovaCrate       | [Link](#LOAD_CRATE)         |
| Parent -> NovaCrate | `UPDATE_CRATE`       | To update the currently loaded crate | [Link](#UPDATE_CRATE)       |
| Parent -> NovaCrate | `GET_CRATE`          | To get the currently loaded crate    | [Link](#GET_CRATE)          |

### Messages sent by NovaCrate

These messages will be sent by NovaCrate to the parent page.

#### READY

This message is sent when NovaCrate is ready to receive messages from the parent page.

```typescript
type ReadyMessage = {
    source: "novacrate"
    type: "READY"
    novaCrateVersion: string
    messageInterfaceVersion: number // currently: 1
}
```

- `novaCrateVersion` is the version of NovaCrate that is currently running in the iframe.  
- `messageInterfaceVersion` is the version of the message interface that is currently used. This number is incremented only for breaking changes. Please check if this version matches the expected version in your application.
If your application sends messages that NovaCrate (no longer) understands, they will be silently ignored.

#### CRATE_CHANGED

This message is sent whenever the user saves their changes in NovaCrate. It contains the current state of the crate
in the `metadata` field.

```typescript
type CrateChangedMessage = {
    source: "novacrate"
    type: "CRATE_CHANGED"
    metadata: string
}
```

- `metadata` is a JSON string representing the current state of the crate metadata. Corresponds to the content of the `ro-crate-metadata.json` file.

#### GET_CRATE_RESPONSE

This message is sent in response to a `GET_CRATE` message. It contains the current state of the crate
in the `metadata` field.

```typescript
type GetCrateResponseMessage = {
    source: "novacrate"
    type: "GET_CRATE_RESPONSE"
    metadata: string
}
```

- `metadata` is a JSON string representing the current state of the crate metadata. Corresponds to the content of the `ro-crate-metadata.json` file.


### Messages sent by parent page

These messages may be sent by the parent page to NovaCrate.

#### LOAD_CRATE

This message is used to load a crate into NovaCrate from the parent page. It should be sent immediately after the `READY` event was received
by the parent page. In Iframe mode, NovaCrate is unresponsive until a crate is loaded through the `LOAD_CRATE` message.

```typescript
type LoadCrateMessage = {
    target: "novacrate"
    type: "LOAD_CRATE"
    metadata: string
}
```

- `metadata` is a JSON string representing the crate metadata to be loaded. Corresponds to the content of the `ro-crate-metadata.json` file.

#### UPDATE_CRATE

This message is used to update a crate that has already been loaded into NovaCrate. NovaCrate will automatically reload all entities from the updated crate,
overwriting local changes in case of conflicts. In case an entity did not change in the update and the user has made changes, the changes are preserved.

```typescript
type UpdateCrateMessage = {
    target: "novacrate"
    type: "UPDATE_CRATE"
    metadata: string
}
```

- `metadata` is a JSON string representing the crate metadata to be loaded. Corresponds to the content of the `ro-crate-metadata.json` file.


#### GET_CRATE

This message can be sent by the parent page to request the current state of the crate from NovaCrate. In return, a `GET_CRATE_RESPONSE` message will be sent by NovaCrate. Note that
NovaCrate automatically sends a `CRATE_CHANGED` message whenever the user saves their changes in NovaCrate.

```typescript
type GetCrateMessage = {
    target: "novacrate"
    type: "GET_CRATE"
}
```

## Example

A working example of the Iframe integration can be found [here](https://github.com/craquet/novacrate-iframe-test).