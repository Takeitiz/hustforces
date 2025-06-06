export interface PageRequest {
    page: number;
    size: number;
    sort?: string;
    sortDirection?: 'ASC' | 'DESC';
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}