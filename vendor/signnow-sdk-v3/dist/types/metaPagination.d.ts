type PaginationObjectLinks = {
    next?: string;
    previous?: string;
};
type PaginationLinks = PaginationObjectLinks | string[];
interface Pagination {
    count: number;
    currentPage: number;
    perPage: number;
    total: number;
    totalPages: number;
    links?: PaginationLinks;
}
export interface MetaPagination {
    pagination: Pagination;
}
export {};
