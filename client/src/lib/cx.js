/** Join conditional class names. */
export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}
