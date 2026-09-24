/**
 * UTF-8 byte length, counted by hand.
 *
 * This runs in the plugin BACKEND, inside Decaid's embedded JS engine. That
 * engine has no TextEncoder — asking it for one is what produced
 * "TextEncoder is not defined" in the plugin log the moment the upload proxy
 * tried to size its Content-Length header. Web APIs are not available there;
 * a loop is.
 *
 * Content-Length has to be BYTES: shot JSON carries bean names, profile titles
 * and tasting notes, so the string length and the byte length differ and a
 * short header truncates the body (or, on a server that trusts it, loses it).
 */
export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c < 0x80) {
      bytes += 1;
    } else if (c < 0x800) {
      bytes += 2;
    } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < value.length) {
      // Surrogate pair: four bytes, and the low surrogate is consumed here.
      const low = value.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        bytes += 4;
        i++;
      } else {
        bytes += 3; // lone high surrogate: encoded as the replacement character
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}
