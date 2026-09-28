/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, ReactElement, ReactNode, useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from "@heroicons/react/20/solid";
import SyncLoader from "react-spinners/SyncLoader";
import {
  V2_CARD_SHELL,
  V2_INPUT,
  V2_MUTED,
  V2_STRONG,
  V2_TABLE_BODY,
  V2_TABLE_HEAD,
  V2_TABLE_ROW,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const PAGE_BTN =
  "w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-colors";
const PAGE_BTN_ACTIVE = "bg-[#3363AD] text-white";
const PAGE_BTN_IDLE =
  "text-[#5B6575] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-700";
const ARROW_BTN =
  "p-1.5 rounded-xl text-[#9AA3B2] hover:text-[#3363AD] hover:bg-[#F1F5F9] dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors";
const CHECKBOX =
  "w-4 h-4 text-[#3363AD] bg-white dark:bg-slate-800 border-[#B8CDE0] dark:border-slate-600 rounded focus:ring-[#3363AD] cursor-pointer";

export interface TableFilterDef {
  key: string;
  label?: string;
  type?: "select" | "date";
  options?: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  renderFilter?: ReactNode;
}

export interface TableColumn {
  title: string;
  key: string;
  render?: (row: any) => React.ReactNode;
  sortable?: boolean;
}

export interface TableProps {
  columns: TableColumn[];
  data: Array<any>;
  totalItems?: number;
  currentPage?: number;
  itemsPerPage?: number;
  filtersComponent?: ReactNode;
  headerComponent?: ReactNode;
  actionBtn?: ReactNode | ReactElement;
  searchComponent?: ReactNode | ReactElement;
  allowFilter?: boolean;
  searchFun?: (searchq: string) => void;
  isLoading?: boolean;
  onChangePage?: (page: number) => void;
  hideFilters?: boolean;
  position?: string;
  paginate?: boolean;
  
  // New features
  selectable?: boolean;
  /** When set, checkboxes reflect this list (enables cross-page selection in parent). */
  selectedRowIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  currentSortKey?: string;
  currentSortOrder?: "asc" | "desc";
  rowsPerPageOptions?: number[];
  onRowsPerPageChange?: (limit: number) => void;
  filters?: TableFilterDef[];
  onResetFilters?: () => void;
}

const Table: FC<TableProps> = ({
  columns,
  data,
  currentPage = 1,
  totalItems = data.length,
  itemsPerPage = 15,
  filtersComponent,
  actionBtn,
  allowFilter = true,
  searchFun,
  isLoading,
  searchComponent,
  onChangePage,
  position,
  headerComponent,
  paginate = true,
  selectable = false,
  selectedRowIds,
  onSelectionChange,
  onSort,
  currentSortKey,
  currentSortOrder,
  rowsPerPageOptions = [10, 15, 30, 50, 100],
  onRowsPerPageChange,
  filters,
  onResetFilters,
}) => {
  const [searchText, setSearchText] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const showPagination = paginate ? totalItems > 0 : false;
  const startPage = Math.max(1, currentPage - 2);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const endPage = Math.min(totalPages, Math.max(1, startPage + 2));

  const handleTableSearch = (searchq: string) => {
    setSearchText(searchq);
  };

  useEffect(() => {
    const handleSearch = setTimeout(() => {
      if (searchFun && searchText !== undefined) {
        searchFun(searchText);
      }
    }, 300);
    return () => clearTimeout(handleSearch);
  }, [searchText, searchFun]);

  // Handle row selection (onSelectionChange receives IDs selected on the current page)
  const pageIds = data.map((r, i) => r.id || i.toString());
  const pageSelectedIds = selectedRowIds
    ? pageIds.filter((id) => selectedRowIds.includes(id))
    : Array.from(selectedIds);

  const handleSelectAll = (checked: boolean) => {
    const nextPageIds = checked ? pageIds : [];
    if (!selectedRowIds) {
      setSelectedIds(new Set(nextPageIds));
    }
    if (onSelectionChange) onSelectionChange(nextPageIds);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const base = selectedRowIds ? pageSelectedIds : Array.from(selectedIds);
    const newSet = new Set(base);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    if (!selectedRowIds) {
      setSelectedIds(newSet);
    }
    if (onSelectionChange) onSelectionChange(Array.from(newSet));
  };

  const allSelected = data.length > 0 && pageSelectedIds.length === data.length;
  const someSelected = pageSelectedIds.length > 0 && pageSelectedIds.length < data.length;

  const handleSortClick = (columnKey: string) => {
    if (!onSort) return;
    if (currentSortKey === columnKey) {
      // Toggle
      onSort(columnKey, currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(columnKey, "asc");
    }
  };

  return (
    <div className={`${V2_CARD_SHELL} overflow-hidden`}>
      <div className='p-4 border-b border-[rgba(51,99,173,0.12)] dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        {/* Left side: Search & Inline Filters */}
        <div className='flex flex-wrap items-center gap-3 w-full lg:w-auto'>
          {searchComponent}
          {searchFun && (
            <div className='relative w-full sm:w-auto sm:min-w-[240px]'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                <MagnifyingGlassIcon className='w-4 text-[#9AA3B2]' />
              </div>
              <input
                type='text'
                value={searchText}
                onChange={(e) => handleTableSearch(e.target.value)}
                className={`block w-full py-2 pl-9 pr-3 text-sm placeholder:text-[#9AA3B2] ${V2_INPUT}`}
                placeholder='Search…'
              />
            </div>
          )}
          
          {/* Dynamic Filters Array */}
          {filters && filters.length > 0 && (
            <div className='flex flex-wrap items-center gap-2'>
              {filters.map((f) => {
                if (f.renderFilter) {
                  return <div key={f.key} className='min-w-[160px]'>{f.renderFilter}</div>;
                }
                if (f.type === "date") {
                  return (
                    <div key={f.key} className='flex items-center gap-1.5'>
                      <label className={`text-xs font-semibold whitespace-nowrap ${V2_MUTED}`}>{f.label}</label>
                      <input
                        type='date'
                        value={f.value}
                        onChange={(e) => f.onChange(e.target.value)}
                        className={`px-2.5 py-1.5 text-sm ${V2_INPUT}`}
                      />
                    </div>
                  );
                }
                return (
                  <select
                    key={f.key}
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className={`px-2.5 py-1.5 text-sm ${V2_INPUT}`}
                  >
                    <option value=''>{f.label}</option>
                    {f.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                );
              })}
            </div>
          )}

          {headerComponent}
          {allowFilter && filtersComponent && (
            <div className='flex items-center gap-2'>
              {filtersComponent}
            </div>
          )}

          {onResetFilters && (searchText || (filters && filters.some(f => f.value))) && (
             <button 
                onClick={() => {
                  setSearchText("");
                  onResetFilters();
                }} 
                className="text-[#3363AD] dark:text-blue-300 text-xs font-bold hover:underline px-2 whitespace-nowrap"
              >
                Reset Filters
              </button>
          )}
        </div>
        
        {/* Right side: Actions */}
        <div className='flex items-center gap-3 justify-end'>
          {actionBtn}
        </div>
      </div>

      <div className='relative w-full overflow-x-auto'>
        {isLoading && (
          <div className='absolute inset-0 bg-white/60 dark:bg-slate-900/60 z-10 flex justify-center items-center backdrop-blur-[1px]'>
            <SyncLoader color='#3363AD' size={10} />
          </div>
        )}

        {data.length > 0 ? (
          <table className={`w-full text-sm text-left ${V2_MUTED}`}>
            <thead className={V2_TABLE_HEAD}>
              <tr>
                {selectable && (
                  <th scope='col' className='px-4 py-3 w-12'>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={input => {
                          if (input) input.indeterminate = someSelected;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className={CHECKBOX}
                      />
                    </div>
                  </th>
                )}
                {columns.map((column, columnIndex) => (
                  <th 
                    key={columnIndex} 
                    scope='col' 
                    className={`px-4 py-3 ${column.sortable ? 'cursor-pointer hover:text-[#3363AD] transition-colors group' : ''}`}
                    onClick={() => column.sortable && handleSortClick(column.key)}
                  >
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {column.title}
                      {column.sortable && (
                        <span className="text-[#9AA3B2] group-hover:text-[#3363AD] flex-shrink-0">
                          {currentSortKey === column.key ? (
                            currentSortOrder === 'asc' ? <ArrowUpIcon className="w-3.5 h-3.5 text-[#3363AD]" /> : <ArrowDownIcon className="w-3.5 h-3.5 text-[#3363AD]" />
                          ) : (
                            <ArrowsUpDownIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={V2_TABLE_BODY}>
              {data.map((row, rowIndex) => {
                const rowId = row.id || rowIndex.toString();
                const isSelected = selectedRowIds
                  ? selectedRowIds.includes(rowId)
                  : selectedIds.has(rowId);
                return (
                  <tr 
                    key={rowId} 
                    className={`${V2_TABLE_ROW} ${isSelected ? 'bg-[#EBF0F9]/60 dark:bg-slate-800/60' : ''}`}
                  >
                    {selectable && (
                      <td className='px-4 py-3 w-12'>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                            className={CHECKBOX}
                          />
                        </div>
                      </td>
                    )}
                    {columns.map((column, cellIndex) => (
                      <td className='px-4 py-3' key={cellIndex}>
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className='p-12 text-center'>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-[16px] bg-[#EBF0F9] dark:bg-slate-700 mb-3">
              <FunnelIcon className="w-7 h-7 text-[#3363AD]/50 dark:text-blue-300/60" />
            </div>
            <h2 className={`text-sm font-bold ${V2_STRONG}`}>No data found</h2>
            <p className={`mt-1 text-xs ${V2_MUTED}`}>Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {showPagination && data.length > 0 && (
        <div className='px-4 py-3 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className={`flex items-center text-xs whitespace-nowrap ${V2_MUTED}`}>
            <span>
              Showing <span className={`font-bold ${V2_STRONG}`}>{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to <span className={`font-bold ${V2_STRONG}`}>{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className={`font-bold ${V2_STRONG}`}>{totalItems}</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            {onRowsPerPageChange && (
              <div className={`hidden sm:flex items-center gap-2 text-xs ${V2_MUTED}`}>
                <label htmlFor="rows-per-page">Rows per page</label>
                <select
                  id="rows-per-page"
                  value={itemsPerPage}
                  onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                  className={`text-xs py-1 pl-2 pr-6 ${V2_INPUT}`}
                >
                  {rowsPerPageOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            <nav className='flex items-center gap-1'>
              <button
                onClick={() => onChangePage && currentPage > 1 && onChangePage(currentPage - 1)}
                disabled={currentPage === 1}
                className={ARROW_BTN}
              >
                <ChevronLeftIcon className='w-5 h-5' />
              </button>

              {startPage > 1 && (
                <>
                  <button
                    className={`${PAGE_BTN} ${currentPage === 1 ? PAGE_BTN_ACTIVE : PAGE_BTN_IDLE}`}
                    onClick={() => onChangePage && onChangePage(1)}
                  >
                    1
                  </button>
                  {startPage > 2 && <span className="px-1 text-[#9AA3B2]">…</span>}
                </>
              )}

              {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                const pg = startPage + i;
                const isActive = pg === currentPage;
                return (
                  <button
                    key={pg}
                    className={`${PAGE_BTN} ${isActive ? PAGE_BTN_ACTIVE : PAGE_BTN_IDLE}`}
                    onClick={() => onChangePage && onChangePage(pg)}
                  >
                    {pg}
                  </button>
                );
              })}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && <span className="px-1 text-[#9AA3B2]">…</span>}
                  <button
                    className={`${PAGE_BTN} ${currentPage === totalPages ? PAGE_BTN_ACTIVE : PAGE_BTN_IDLE}`}
                    onClick={() => onChangePage && onChangePage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => onChangePage && currentPage < totalPages && onChangePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={ARROW_BTN}
              >
                <ChevronRightIcon className='w-5 h-5' />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
