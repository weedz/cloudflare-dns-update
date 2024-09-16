import * as fs from "node:fs";
import * as path from "node:path";
import { CloudflareAPI } from "./CloudflareAPI.js";
import { styleText } from "node:util";

const dir = import.meta.dirname;
const ipFile = path.join(dir, "ip");

const env = (() => {
    if (!process.env.API_TOKEN) {
        throw new Error("Define 'API_TOKEN' in environment");
    }
    if (!process.env.ZONE_IDS) {
        // https://api.cloudflare.com/client/v4/zones
        throw new Error("Define 'ZONE_IDS' in environment");
    }
    return {
        API_TOKEN: process.env.API_TOKEN,
        ZONE_IDS: process.env.ZONE_IDS.split(","),
    };
})();

async function main() {
    const lastKnownIp = readLastKnownIp();

    const currentIp = await getCurrentIp();

    if (currentIp !== lastKnownIp) {
        // TODO: Notify "authorities" about the change
        process.stdout.write("NEW IP DETECTED!\n\n");
        process.stdout.write(`  Old ip: ${lastKnownIp}\n`);
        process.stdout.write(`  New ip: ${currentIp}\n`);
        updateLastKnownIp(currentIp);
        // Only update DNS records if we know the previous IP
        if (lastKnownIp) {
            await updateDnsRecords(lastKnownIp, currentIp);
        }
    } else {
        process.stdout.write("Ip has not changed.\n");
    }
}

function readLastKnownIp(): string | null {
    if (!fs.existsSync(ipFile)) {
        return null;
    }

    return fs.readFileSync(ipFile, "utf8").trim();
}
function updateLastKnownIp(ip: string): void {
    fs.writeFileSync(ipFile, ip);
}

async function getCurrentIp() {
    const response = await fetch("https://api.ipify.org/");
    if (!response.ok) {
        throw new Error("ipify.org seems to be down");
    }

    const ip = await response.text();
    return ip.trim();
}

async function updateDnsRecords(lastKnownIp: string, newIp: string) {
    const cloudflare = new CloudflareAPI(env.API_TOKEN);
    // TODO: Should we check all zones or just the zones from `.env` `ZONE_IDS`?
    // 1. Find your Zone ID from the cloudflare dash board ("Overview" when you select a website)
    // 2. Find the IDs for the DNS records to update: <https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records>
    // 3. Update all "selected" dns records: <https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-patch-dns-record>

    for (const zoneId of env.ZONE_IDS) {
        const dnsRecords = await cloudflare.getDnsRecords(zoneId);
        if (dnsRecords instanceof Error) {
            console.error("Error:", dnsRecords);
            continue;
        }
        for (const dnsRecord of dnsRecords.result) {
            if (dnsRecord.type !== "A") {
                process.stdout.write("Encountered record with unsupported type. We only handle A records\n");
                continue;
            }

            process.stdout.write(`name: ${dnsRecord.name}\n`);
            process.stdout.write(`  type: ${dnsRecord.type}\n`);
            process.stdout.write(`  content: ${dnsRecord.content}\n`);
            if (dnsRecord.content !== lastKnownIp) {
                // NOTE: We do not touch these :+1:
                process.stdout.write(`  action: ${styleText("yellow", "* External DNS record *")} (not touching)\n`);
            } else if (dnsRecord.content !== newIp) {
                process.stdout.write(`  action: ${styleText("red", "** !!NEEDS UPDATE!! **")}\n`);
                const result = await cloudflare.updateDnsRecord(zoneId, dnsRecord.id, { content: newIp });
                if (result instanceof Error || result.errors.length !== 0 || !result.success) {
                    process.stdout.write(styleText("red", "!! FAILED TO UPDATE DNS RECORDS !!"));
                } else {
                    process.stdout.write(`    ${styleText("green", "DNS records updated")}\n`)
                }
            } else {
                process.stdout.write(`  action: ${styleText("green", "Nothing changed")}\n`);
            }
        }
    }

}

await main();
