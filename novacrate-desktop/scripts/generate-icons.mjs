// Generates the Tauri app icons (PNG) required by `tauri.conf.json`.
// Run: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(here, "..", "icons")

// --- Minimal PNG encoder -----------------------------------------------------
const CRC_TABLE = (() => {
    const table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
        let c = n
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        table[n] = c
    }
    return table
})()

function crc32(buffer) {
    let crc = -1
    for (let i = 0; i < buffer.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff]
    return (crc ^ -1) >>> 0
}

function chunk(type, data) {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(typeAndData))
    return Buffer.concat([length, typeAndData, crc])
}

function encodePng(width, height, rgba) {
    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(width, 0)
    ihdr.writeUInt32BE(height, 4)
    ihdr[8] = 8 // bit depth
    ihdr[9] = 6 // color type: RGBA
    // Raw scanlines, each prefixed with filter byte 0.
    const raw = Buffer.alloc(height * (1 + width * 4))
    for (let y = 0; y < height; y++) {
        const rowStart = y * (1 + width * 4)
        raw[rowStart] = 0
        rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4)
    }
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", ihdr),
        chunk("IDAT", deflateSync(raw)),
        chunk("IEND", Buffer.alloc(0))
    ])
}

// --- Icon drawing ------------------------------------------------------------
const BACKGROUND = [79, 70, 229, 255] // indigo-600
const FOREGROUND = [255, 255, 255, 255]

/** Distance from point to the segment between (x1,y1) and (x2,y2). */
function segmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1
    const dy = y2 - y1
    const lengthSquared = dx * dx + dy * dy
    let t = lengthSquared === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lengthSquared
    t = Math.min(1, Math.max(0, t))
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/**
 * Draws a rounded indigo square with a white "N".
 * Returns an RGBA buffer of `size * size * 4` bytes.
 */
function drawIcon(size) {
    const rgba = Buffer.alloc(size * size * 4)
    const radius = 0.2 * size
    const halfThickness = 0.075 * size
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Rounded square mask (pixel centers).
            const u = (x + 0.5) / size
            const v = (y + 0.5) / size
            const cu = Math.min(Math.max(u, radius / size), 1 - radius / size)
            const cv = Math.min(Math.max(v, radius / size), 1 - radius / size)
            const cornerDistance = Math.hypot(u - cu, v - cv) * size
            if (cornerDistance > radius) continue

            // White "N": two vertical bars plus a diagonal.
            const inLeftBar = u >= 0.22 && u <= 0.34 && v >= 0.26 && v <= 0.74
            const inRightBar = u >= 0.66 && u <= 0.78 && v >= 0.26 && v <= 0.74
            const inDiagonal = segmentDistance(u, v, 0.32, 0.28, 0.68, 0.72) <= halfThickness / size
            const color = inLeftBar || inRightBar || inDiagonal ? FOREGROUND : BACKGROUND
            const offset = (y * size + x) * 4
            for (let i = 0; i < 4; i++) rgba[offset + i] = color[i]
        }
    }
    return rgba
}

mkdirSync(iconsDir, { recursive: true })
const targets = [
    ["32x32.png", 32],
    ["128x128.png", 128],
    ["128x128@2x.png", 256],
    ["icon.png", 512],
    ["app-icon.png", 1024]
]
for (const [name, size] of targets) {
    writeFileSync(join(iconsDir, name), encodePng(size, size, drawIcon(size)))
    console.log(`wrote icons/${name} (${size}x${size})`)
}
