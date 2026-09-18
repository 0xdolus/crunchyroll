export function validateHttps(url: string): string {
  if (!url.startsWith("https://")) {
    throw new Error("Only HTTPS URLs are allowed");
  }
  return url;
}
