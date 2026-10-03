/**
 * Author: Claude Opus 5.5 (Bubba sub-agent)
 * Date: 03-Oct-2026
 * PURPOSE: Reads the real pixel size of a JPEG or PNG under public/ at build
 *   time, so a <Image> can be given width/height that match the photo's true
 *   shape. Added for the SEO checklist's layout-shift item: field-note covers
 *   and project heroes were hard-coded to 1200x800 (3:2) and then capped with
 *   max-h-[75vh] + object-contain, so for any portrait or squarer photo the
 *   box the browser reserved before load did not match the box it drew after,
 *   and everything below the cover jumped (Lighthouse CLS 0.153 on field notes,
 *   03-Oct-2026). With the true ratio in width/height, `h-auto` reserves the
 *   right height up front.
 *
 *   JPEG: walks the marker segments to the first SOFn frame header, and reads
 *   the EXIF Orientation tag on the way — orientations 5-8 are rotated 90°, and
 *   browsers (and the Next.js optimizer) display them rotated, so width and
 *   height are swapped to match what is drawn. PNG: reads the IHDR chunk.
 *   Anything else, a missing file, or a malformed header returns null and the
 *   caller keeps its old fallback size — never throws into a page render.
 *
 *   Dependency-free on purpose: `sharp` and `image-size` are only present as
 *   Next.js internals, not as dependencies of this site.
 * SRP/DRY check: Pass — no existing dimension helper in lib/ or app/; photo
 *   dimensions are not stored in content frontmatter.
 */
import fs from "fs";
import path from "path";

export interface ImageSize {
  width: number;
  height: number;
}

const publicDir = path.join(process.cwd(), "public");

// EXIF Orientation from an APP1 segment body (starting at "Exif\0\0").
// Returns 1 (upright) when absent or unreadable.
function exifOrientation(buf: Buffer, start: number, end: number): number {
  if (buf.toString("ascii", start, start + 4) !== "Exif") return 1;
  const tiff = start + 6;
  if (tiff + 8 > end) return 1;
  const little = buf.toString("ascii", tiff, tiff + 2) === "II";
  const u16 = (o: number) => (little ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = (o: number) => (little ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const ifd0 = tiff + u32(tiff + 4);
  if (ifd0 + 2 > end) return 1;
  const entries = u16(ifd0);
  for (let i = 0; i < entries; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (entry + 12 > end) break;
    if (u16(entry) === 0x0112) return u16(entry + 8);
  }
  return 1;
}

function jpegSize(buf: Buffer): ImageSize | null {
  let offset = 2; // skip SOI (FF D8)
  let orientation = 1;
  while (offset + 4 <= buf.length) {
    if (buf[offset] !== 0xff) return null;
    const marker = buf[offset + 1];
    // Fill bytes and standalone markers carry no length field.
    if (marker === 0xff) { offset += 1; continue; }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
    const length = buf.readUInt16BE(offset + 2);
    const body = offset + 4;
    if (marker === 0xe1) orientation = exifOrientation(buf, body, offset + 2 + length);
    // SOF0-SOF15, except DHT (C4), JPG (C8) and DAC (CC).
    const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isFrame) {
      if (body + 5 > buf.length) return null;
      const height = buf.readUInt16BE(body + 1);
      const width = buf.readUInt16BE(body + 3);
      if (!width || !height) return null;
      return orientation >= 5 && orientation <= 8 ? { width: height, height: width } : { width, height };
    }
    offset += 2 + length;
  }
  return null;
}

function pngSize(buf: Buffer): ImageSize | null {
  if (buf.length < 24 || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return width && height ? { width, height } : null;
}

/**
 * Pixel size of a site-relative image path ("/photos/…") as it is displayed.
 * Returns null for remote URLs, other formats, or anything unreadable.
 */
export function getPublicImageSize(src: string): ImageSize | null {
  if (!src.startsWith("/")) return null;
  const filePath = path.join(publicDir, decodeURIComponent(src));
  // Stay inside public/ even if a content path is malformed.
  if (!filePath.startsWith(publicDir + path.sep)) return null;
  try {
    const buf = fs.readFileSync(filePath);
    if (buf[0] === 0xff && buf[1] === 0xd8) return jpegSize(buf);
    if (buf.toString("ascii", 1, 4) === "PNG") return pngSize(buf);
    return null;
  } catch {
    return null;
  }
}
