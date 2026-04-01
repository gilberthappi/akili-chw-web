/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, Fragment, ReactElement, ReactNode, useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import SyncLoader from "react-spinners/SyncLoader";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { usePopper } from "react-popper";
// import Protected from "../auth/Protected";

interface TableColumn {
  title: string;
  key: string;
  render?: (row: any) => React.ReactNode;
}
interface TableProps {
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
  usedFilters?: string;
  paginate?: boolean;
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
  hideFilters,
  position,
  usedFilters,
  headerComponent,
  paginate = true,
}) => {
  // const [filtersOPened, setFiltersOpened] = useState(false);
  const [searchText, setSearchText] = useState<string>();
  const showPagination = paginate ? totalItems / itemsPerPage > 1 : false;
  const startPage = Math.max(1, currentPage - 2);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const endPage = Math.min(totalPages, startPage + 2);
  // const closeFiltersDrawer = () => {
  //   setFiltersOpened(false);
  // };
  // const openFiltersDrawer = () => {
  //   setFiltersOpened(true);
  // };

  const handleTableSearch = (searchq: string) => {
    setSearchText(searchq);
  };

  useEffect(() => {
    const handleSearch = setTimeout(() => {
      if (searchFun && searchText != undefined) {
        searchFun(searchText);
      }
    }, 300);
    return () => clearTimeout(handleSearch);
  }, [searchText, searchFun]);
  const isActive = (pg: number): string => {
    return pg == currentPage ? "text-darkblue font-extrabold" : "";
  };

  useEffect(() => {
    if (hideFilters) {
      // closeFiltersDrawer();
    }
  }, [hideFilters]);

  const filters = usedFilters
    ? usedFilters
        .split("&")
        .map((param) => param.split("="))
        .filter(([key, value]) => key !== "" && value !== "" && value != "all")
        .map(([key, value]) => [key, decodeURIComponent(value)])
    : [];

  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end", // Adjust placement as needed
    modifiers: [
      {
        name: "offset",
        options: {
          // offset: [50, -2], // Adjust the horizontal and vertical offsets as needed
        },
      },
    ],
  });

  return (
    <div className='rounded-t relative border p-0 bg-white'>
      <div className='mt-3 px-5 mb-3'>
        {searchComponent && searchComponent}
        <div className='flex flex-wrap items-center space-x-2 space-y-1.5 sm:space-y-0'>
          {headerComponent && headerComponent}

          {searchFun && (
            <div className='relative rounded-md shadow-sm w-full max-w-md'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                <span className='text-gray-400 sm:text-sm'>
                  <MagnifyingGlassIcon className='w-5 stroke-2' />
                </span>
              </div>
              <input
                type='text'
                name='price'
                id='price'
                onChange={(e) => handleTableSearch(e.target.value)}
                className='block w-full rounded-md outline-none border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400  focus:ring-inset focus:ring-darkblue sm:text-sm sm:leading-6'
                placeholder='Search ...'
              />
            </div>
          )}
          {allowFilter && filtersComponent && (
            <div className='relative'>
              {filtersComponent && (
                <Popover ref={setReferenceElement} className='relative'>
                  <PopoverButton className={"outline-none"}>
                    <div
                      className='rounded-md ring-1 ring-inset ring-gray-300 py-2.5 px-2 flex items-center space-x-3 relative text-gray-500 cursor-pointer'
                      // onClick={openFiltersDrawer}
                    >
                      <FunnelIcon className='w-6' />
                      <span>Filters</span>
                      {filters.length > 0 && (
                        <span className=' inline-block px-2.5 py-1.5 text-xs font-semibold leading-none rounded-full bg-darkblue text-white'>
                          {filters.length}
                        </span>
                      )}
                    </div>
                  </PopoverButton>
                  <PopoverPanel
                    style={styles.popper}
                    {...attributes.popper}
                    ref={setPopperElement}
                    className={"fixed z-50 -right-8 w-[480px]"}
                  >
                    <div className=' border border-gray-100 shadow-2xl rounded-md p-10 rounded-sm w-full bg-white'>
                      {filtersComponent}
                    </div>
                  </PopoverPanel>
                </Popover>
              )}
            </div>
          )}
          {actionBtn && actionBtn}
        </div>
      </div>
      {isLoading && (
        <div className='p-3 w-full absolute z-20 flex justify-center'>
          <SyncLoader color='#4d81d2' />
        </div>
      )}

      {data.length > 0 ? (
        <div
          className={
            position
              ? position
              : `absolute ` + ` border-inherit w-full  border box-border bg-inherit`
          }
        >
          <div className='w-full overflow-x-auto'>
            <table className='text-sm text-left text-gray-500 w-full'>
              <thead className='text-xs text-gray-700 uppercase border-b'>
                <tr key={1}>
                  {columns.map((column, columnIndex) => (
                    <Fragment key={columnIndex}>
                        <th scope='col' className='px-6 py-3'>
                          {column.title}
                        </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr className='bg-white border-b' key={rowIndex}>
                    {columns.map((column, cellIndex) => (
                      <Fragment key={cellIndex}>
                         <td className='px-6 py-2' key={cellIndex}>
                            {column.render ? column.render(row) : row[column.key]}
                          </td>
                      </Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showPagination && (
            <div className='py-1 flex justify-between px-1'>
              <div>
                <span className='text-sm font-bold'>
                  Showing{" "}
                  {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
                  {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                </span>
              </div>
              <nav className='isolate inline-flex -space-x-px rounded-md'>
                <a
                  href='#'
                  className='relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400  ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                >
                  <ChevronLeftIcon
                    onClick={() => {
                      const prevPage = currentPage - 1;
                      if (prevPage > 0 && onChangePage) {
                        onChangePage(prevPage);
                      }
                    }}
                    className='h-5 w-5'
                    aria-hidden='true'
                  />
                </a>

                {startPage > 1 && (
                  <>
                    <button
                      className={`relative inline-flex ${isActive(
                        1,
                      )} items-center rounded-l-md px-2 py-2 text-gray-400  ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0`}
                      onClick={() => onChangePage && onChangePage(1)}
                    >
                      1
                    </button>
                    {startPage > 2 && <span>...</span>}
                  </>
                )}
                {Array.from({ length: endPage - startPage + 1 }, (_, i) => (
                  <button
                    className={`relative inline-flex ${isActive(
                      startPage + i,
                    )} items-center rounded-l-md px-2 py-2 text-gray-400  ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0`}
                    key={startPage + i}
                    onClick={() => onChangePage && onChangePage(startPage + i)}
                  >
                    {startPage + i}
                  </button>
                ))}
                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && <span>...</span>}
                    <button
                      className={`relative inline-flex items-center ${isActive(
                        totalPages,
                      )} rounded-l-md px-2 py-2 text-gray-400  ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0`}
                      onClick={() => onChangePage && onChangePage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <a
                  href='#'
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400  ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0`}
                >
                  <ChevronRightIcon
                    onClick={() => {
                      const nextPage = currentPage + 1;
                      if (nextPage <= totalPages && onChangePage) {
                        onChangePage(nextPage);
                      }
                    }}
                    className='h-5 w-5'
                    aria-hidden='true'
                  />
                </a>
              </nav>
            </div>
          )}
        </div>
      ) : (
        <div className='p-4'>
          <h2 className=' text-lg font-medium'>No data to display</h2>
        </div>
      )}
    </div>
  );
};

export default Table;
