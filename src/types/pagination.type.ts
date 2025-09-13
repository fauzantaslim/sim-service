/**
 * Parameter paginasi umum untuk request list data.
 */
export type PaginationParams = {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

/**
 * Parameter paginasi khusus untuk KTP dengan filter enum.
 */
export type KTPPaginationParams = PaginationParams & {
  jenis_kelamin?: string;
  agama?: string;
  status_perkawinan?: string;
  gol_darah?: string;
};

/**
 * Parameter paginasi khusus untuk SIM dengan filter enum.
 */
export type SIMPaginationParams = PaginationParams & {
  jenis_sim?: string;
};

/**
 * Response paginasi umum untuk list data.
 */
export type PaginationResponse<T> = {
  data: T[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
  };
};
