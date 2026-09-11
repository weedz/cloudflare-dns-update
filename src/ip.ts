// TODO: Could use `deps/ch_dns`

import { Resolver } from "node:dns/promises";

// dig +short myip.opendns.com @resolver1.opendns.com
export async function getIpOpenDns() {
  const resolver = new Resolver();
  resolver.setServers(["208.67.222.222"]);

  const ip = await resolver.resolve4("myip.opendns.com");
  if (!ip[0]) {
    throw new Error("opendns did not resolve an ip address");
  }

  return ip[0].trim();
}

export async function getIpCloudflare() {
  const response = await fetch("https://1.1.1.1/cdn-cgi/trace");
  if (!response.ok) {
    throw new Error("cloudflare seems to be down :shrug:");
  }

  const data = await response.text();
  const ip = data
    .trim()
    .replaceAll("\r", "")
    .split("\n")
    .find((row) => row.startsWith("ip="));
  if (!ip) {
    throw new Error("cloudflare did not return an ip address");
  }

  return ip.trim().substring(3);
}

export function validateIp(ip: string) {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    console.log("invalid parts:", parts);
    return false;
  }
  if (ip === "0.0.0.0") {
    console.log("ip === 0.0.0.0");
    return false;
  }
  for (const partStr of parts) {
    const part = Number.parseInt(partStr, 10);
    if (part < 0 || part > 255) {
      console.log("invalid part:", part);
      return false;
    }
  }
  return true;
}
