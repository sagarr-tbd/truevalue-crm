export interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  startIndex?: number;
  endIndex?: number;
  filterInfo?: string;
  showItemsPerPage?: boolean;
  showPageInfo?: boolean;
  maxVisiblePages?: number;
  className?: string;
}
