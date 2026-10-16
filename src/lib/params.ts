/** Reject ambiguous repeated parameters rather than calling string methods on arrays. */
export function singleParam(value: unknown): string { return typeof value === "string" ? value : ""; }
