import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";

const MAX_REDIRECTS = 5;

function normalizedIpAddress(value: string) {
  const parsed = ipaddr.parse(value);
  if (parsed.kind() === "ipv6") {
    const ipv6 = parsed as ipaddr.IPv6;
    return ipv6.isIPv4MappedAddress() ? ipv6.toIPv4Address() : ipv6;
  }
  return parsed;
}

export function isPublicIpAddress(value: string) {
  try {
    return normalizedIpAddress(value).range() === "unicast";
  } catch {
    return false;
  }
}

export async function assertPublicHttpUrl(input: string) {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Reference URL must use http or https.");
  }
  if (url.username || url.password) {
    throw new Error("Reference URLs cannot contain credentials.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname.includes(".") || hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Reference URL must resolve to a public website.");
  }

  const addresses = ipaddr.isValid(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicIpAddress(address))) {
    throw new Error("Private, reserved, and local network addresses cannot be used as portfolio references.");
  }

  url.hash = "";
  return url;
}

export async function fetchPublicHtml(input: string, options: { signal: AbortSignal; maxBytes: number }) {
  let current = await assertPublicHttpUrl(input);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(current, {
      headers: {
        "user-agent": "Auto-CaseStudy-ReferenceProbe/0.1 (+portfolio intelligence research)"
      },
      redirect: "manual",
      signal: options.signal
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Reference returned a redirect without a destination.");
      if (redirectCount === MAX_REDIRECTS) throw new Error("Reference exceeded the redirect limit.");
      current = await assertPublicHttpUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Reference returned HTTP ${response.status}.`);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) throw new Error("Reference did not return an HTML page.");
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > options.maxBytes) throw new Error("Reference HTML exceeds the capture limit.");
    if (!response.body) return "";

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let byteCount = 0;
    let html = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteCount += value.byteLength;
      if (byteCount > options.maxBytes) {
        await reader.cancel();
        throw new Error("Reference HTML exceeds the capture limit.");
      }
      html += decoder.decode(value, { stream: true });
    }
    return html + decoder.decode();
  }

  throw new Error("Reference could not be fetched safely.");
}
