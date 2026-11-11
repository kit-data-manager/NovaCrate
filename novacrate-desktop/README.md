# NovaCrate Desktop

Native desktop shell for NovaCrate built with [Tauri](https://tauri.app). The
Next.js editor runs in a webview, while all crate I/O is handled by the Rust
backend in this directory.

## How it works

- **Crate ID = local zip path.** A crate is identified by the absolute path of
  its `ro-crate-metadata.json`-style zip file on disk.
- **Working copy in a temp dir.** While a crate is open, the backend extracts
  the zip into a temporary directory (`novacrate-crate-*` in the system temp
  folder). Sessions are reference-counted, so several services may share one
  working copy.
- **Save on every write.** Every mutating command (`write_file`, `move_crate_entry`,
  `delete_crate_entry`) re-zips the working copy into a temporary file next to
  the original and atomically replaces the original zip file.
- **Layout preservation.** Flat RO-Crate zips stay flat; ELN-style zips (crate
  inside a single root folder) keep that layout when saved.
- **Recents.** There is no central crate storage, so the repository service
  keeps a recents list of opened crate paths in the webview's `localStorage`.
  Crates created via `createCrateFromZip` / `createCrateFromMetadata` are
  written to `~/Documents/NovaCrate` by default.
- **Deletion safety.** Deleting a crate moves the zip file to the OS trash
  instead of deleting it permanently.

The frontend implementations that call these commands live in
`lib/persistence/desktop/` in the repository root. The persistence backend is
selected at **build time** via the `PERSISTENCE_BACKEND` environment variable
(`browser` is the default): `next.config.mjs` aliases
`@/lib/persistence/desktop/impl` to the real desktop implementation when
`PERSISTENCE_BACKEND=desktop`, and to a stub otherwise, so the Tauri packages
and the desktop persistence layer are never bundled into the web build.

## Development

```bash
# From the repository root: runs next dev (with the desktop backend selected
# via PERSISTENCE_BACKEND=desktop), the webworker build watch and tauri dev
# in parallel. Requires the web app to be served at :3000.
npm run dev:desktop
```

The `tauri.conf.json` `devUrl` points at `http://localhost:3000`, so the Next
dev server must be running with `PERSISTENCE_BACKEND=desktop` set (that is
what `dev:desktop` does).

## Production builds

For bundling a release app, run `npm run tauri build` from this directory. The
configured `frontendDist` (`../public`) only provides static assets; a full
offline desktop build additionally requires serving the Next.js app (e.g. as a
sidecar process) — see the Tauri documentation.

Regenerate the app icons after changing the logo:

```bash
cd novacrate-desktop && node scripts/generate-icons.mjs
```

## Rust commands

All commands are registered in `src/lib.rs` and implemented in `src/commands.rs`:

| Command                                       | Purpose                                           |
| --------------------------------------------- | ------------------------------------------------- |
| `ping`                                        | Health check                                      |
| `open_crate` / `close_crate`                  | Session lifecycle (extract / cleanup)             |
| `read_file` / `write_file`                    | File I/O on the working copy                      |
| `create_folder`                               | Create a directory                                |
| `list_crate_contents` / `get_crate_file_info` | Directory listing and stat                        |
| `move_crate_entry` / `delete_crate_entry`     | Move and delete (recursive)                       |
| `get_crate_quota`                             | Working copy size and free disk space             |
| `export_crate`                                | Export as `zip` / `eln` / `standalone-json`       |
| `crate_exists`                                | Validate a crate path                             |
| `create_crate_from_zip_bytes`                 | Import + normalize a crate archive                |
| `create_crate_from_metadata`                  | Create a minimal crate zip                        |
| `delete_crate_file`                           | Trash a crate zip                                 |
| `repository_quota`                            | Default crates directory size and free disk space |

## Tests

```bash
cd novacrate-desktop
cargo test
```
