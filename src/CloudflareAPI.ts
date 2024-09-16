import type { DNSRecord, OneResult, PagedResult, Zone } from "./CloudflareAPI/types.js";

// Reference: <https://developers.cloudflare.com/api/>

const API_URL = "https://api.cloudflare.com/client/v4/";

export class CloudflareAPI {
    #apiToken: string;
    constructor(token: string) {
        this.#apiToken = token;
    }

    #fetch(endpoint: string, requestInit: RequestInit = {}) {
        const headers = new Headers(requestInit.headers);
        headers.append("authorization", `Bearer ${this.#apiToken}`);

        requestInit.headers = headers;
        return fetch(`${API_URL}${endpoint}`, requestInit);
    }

    /**
     * NOTE: We only do A records for now.
     *
     * Reference: <https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records>
     */
    async getDnsRecords(zoneId: string) {
        const response = await this.#fetch(`zones/${zoneId}/dns_records?type=A`);
        if (response.status !== 200) {
            return new Error("failed to list dns records");
        }

        const body = await response.json();
        return body as PagedResult<DNSRecord>;
    }

    /**
     * Reference: <https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-patch-dns-record>
     */
    async updateDnsRecord(zoneId: string, dnsRecordId: string, data: Partial<{
        content: string;
        ttl: number;
    }>) {
        const response = await this.#fetch(`zones/${zoneId}/dns_records/${dnsRecordId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
        if (response.status !== 200) {
            return new Error(`failed to update dns record '${dnsRecordId}'`);
        }

        const body = await response.json();
        return body as OneResult<DNSRecord>;
    }

    /**
     * Reference: <https://developers.cloudflare.com/api/operations/zones-get>
     */
    async getZones() {
        const response = await this.#fetch("zones");
        if (response.status !== 200) {
            return new Error("failed to list zones");
        }

        const body = await response.json();
        return body as PagedResult<Zone>;
    }
}
