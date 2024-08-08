import * as fs from "node:fs";
import * as path from "node:path";

const dir = import.meta.dirname;
const ipFile = path.join(dir, "ip");

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

async function updateDnsRecords(ip: string) {
    // 1. Find your Zone ID from the cloudflare dash board ("Overview" when you select a website)
    // 2. Find the IDs for the DNS records to update: <https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records>
    // 3. Update all "selected" dns records: <https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-patch-dns-record>
}


const lastKnownIp = readLastKnownIp();

const currentIp = await getCurrentIp();

if (currentIp !== lastKnownIp) {
    process.stdout.write("NEW IP DETECTED!\n\n");
    process.stdout.write(`  Old ip: ${lastKnownIp}\n`);
    process.stdout.write(`  New ip: ${currentIp}\n`);
    updateLastKnownIp(currentIp);
    // updateDnsRecords(currentIp);
} else {
    process.stdout.write("Ip has not changed.\n");
}
