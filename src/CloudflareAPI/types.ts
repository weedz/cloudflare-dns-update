interface APIResult<TResult> {
    result: TResult,
    result_info: {
        page: number,
        per_page: number,
        total_pages: number,
        count: number,
        total_count: number,
    },
    success: boolean,
    errors: unknown[],
    messages: unknown[],
}
export type PagedResult<TResult> = APIResult<TResult[]>;
export type OneResult<TResult> = APIResult<TResult>;


export interface Zone {
    id: string;
    name: string;
    status: string; // "active" ?
    paused: boolean;
    type: string; // "full" ?
    name_servers: string[];
    original_name_servers: string[];
    /** ISO datetimez string */
    modified_on: string; // 
    /** ISO datetimez string */
    created_on: string;
}

export interface DNSRecord {
    id: string;
    zone_id: string;
    zone_name: string;
    name: string;
    /** "A" | "AAAA" | "CNAME" etc. */
    type: string;
    /** The DNS record */
    content: string;
    ttl: number;
    comment: string;
    tags: string[];
    /** ISO datetimez string */
    modified_on: string;
    /** ISO datetimez string */
    created_on: string;
}

