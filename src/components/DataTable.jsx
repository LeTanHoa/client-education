import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export default function DataTable({
  rows = [],
  columns = [],
  searchKeys = [],
  searchPlaceholder = 'Tìm kiếm...',
  filters = [],
  pageSize = 10,
  emptyText = 'Không có dữ liệu.',
  initialSort = { key: '', direction: 1 },
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState({});
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    return rows
      .filter(row => {
        const matchesSearch =
          !query ||
          searchKeys.some(key =>
            String(
              typeof key === 'function'
                ? key(row)
                : key.split('.').reduce((value, part) => value?.[part], row) ?? ''
            )
              .toLocaleLowerCase('vi')
              .includes(query)
          );
        return (
          matchesSearch &&
          filters.every(
            filter =>
              !selected[filter.key] ||
              String(filter.getValue ? filter.getValue(row) : row[filter.key]) === selected[filter.key]
          )
        );
      })
      .sort((a, b) => {
        if (!sort.key) return 0;
        const column = columns.find(item => item.key === sort.key);
        const av = column?.sortValue
          ? column.sortValue(a)
          : sort.key.split('.').reduce((value, part) => value?.[part], a);
        const bv = column?.sortValue
          ? column.sortValue(b)
          : sort.key.split('.').reduce((value, part) => value?.[part], b);
        return (
          (typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av ?? '').localeCompare(String(bv ?? ''), 'vi', {
                numeric: true,
                sensitivity: 'base',
              })) * sort.direction
        );
      });
  }, [rows, columns, searchKeys, filters, search, selected, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const updateSearch = value => {
    setSearch(value);
    setPage(1);
  };

  const updateFilter = (key, value) => {
    setSelected(current => ({ ...current, [key]: value }));
    setPage(1);
  };

  const toggleSort = key => {
    setSort(current =>
      current.key === key ? { key, direction: -current.direction } : { key, direction: -1 }
    );
    setPage(1);
  };

  return (
    <div className="data-table">
      <div className="data-table-toolbar">
        <label className="data-table-search">
          <Search size={17} />
          <input
            value={search}
            onChange={event => updateSearch(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
        {filters.map(filter => (
          <select
            key={filter.key}
            className="select"
            value={selected[filter.key] || ''}
            onChange={event => updateFilter(filter.key, event.target.value)}
          >
            <option value="">{filter.label}: Tất cả</option>
            {filter.options.map(option => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
        <span className="data-table-count">{filtered.length} kết quả</span>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.key}>
                  {column.sortable === false ? (
                    <span>{column.label}</span>
                  ) : (
                    <button className="table-sort" onClick={() => toggleSort(column.key)}>
                      {column.label}
                      {sort.key === column.key ? (sort.direction === 1 ? ' ↑' : ' ↓') : ' ↕'}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={row._id || row.id || index}>
                {columns.map(column => (
                  <td key={column.key}>
                    {column.render
                      ? column.render(row)
                      : column.key.split('.').reduce((value, part) => value?.[part], row) ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="data-table-pagination">
        <span>
          Hiển thị {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–
          {Math.min(currentPage * pageSize, filtered.length)} / {filtered.length}
        </span>
        <div>
          <button
            className="outline"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Trước
          </button>
          <span>
            Trang {currentPage}/{pageCount}
          </span>
          <button
            className="outline"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
