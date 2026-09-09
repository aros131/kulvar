// Turkish name capitalization for registration. Uses the tr-TR locale case
// mapping, so "i" capitalizes to "İ" and "ı" stays "ı" (capitalizing to "I")
// per real Turkish orthography — not the plain ASCII i/I mapping.
export function toTitleCase(input) {
  if (typeof input !== "string") return input;
  return input
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("tr-TR")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1) : word))
    .join(" ");
}
