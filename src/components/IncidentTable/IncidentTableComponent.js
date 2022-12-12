/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable consistent-return */
/* eslint-disable no-nested-ternary */
import {
  useEffect, useMemo, useCallback, useState,
} from 'react';
import {
  connect,
} from 'react-redux';
import {
  useDebouncedCallback,
} from 'use-debounce';

import mezr from 'mezr';
import {
  FixedSizeList,
} from 'react-window';

import i18next from 'i18n';

import BTable from 'react-bootstrap/Table';

import {
  useTable, useSortBy, useRowSelect, useBlockLayout, useResizeColumns,
} from 'react-table';

import {
  selectIncidentTableRows as selectIncidentTableRowsConnected,
  updateIncidentTableState as updateIncidentTableStateConnected,
} from 'redux/incident_table/actions';

import {
  getReactTableColumnSchemas,
} from 'config/incident-table-columns';

import CheckboxComponent from './subcomponents/CheckboxComponent';
import EmptyIncidentsComponent from './subcomponents/EmptyIncidentsComponent';
import QueryActiveComponent from './subcomponents/QueryActiveComponent';
import QueryCancelledComponent from './subcomponents/QueryCancelledComponent';

import './IncidentTableComponent.scss';

// Ref: https://davidwalsh.name/detect-scrollbar-width
const scrollbarWidth = () => {
  const scrollDiv = document.createElement('div');
  scrollDiv.setAttribute(
    'style',
    'width: 100px; height: 100px; overflow: scroll; position:absolute; top:-9999px;',
  );
  document.body.appendChild(scrollDiv);
  const scrollbarWidthDist = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);
  return scrollbarWidthDist;
};

// Ref: https://stackoverflow.com/a/61390352/6480733
const Delayed = ({
  children, waitBeforeShow = 500,
}) => {
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShown(true);
    }, waitBeforeShow);
    return () => clearTimeout(timer);
  }, [waitBeforeShow]);

  return isShown ? children : null;
};

const IncidentTableComponent = ({
  selectIncidentTableRows,
  updateIncidentTableState,
  incidentTable,
  incidentActions,
  incidents,
  querySettings,
  users,
}) => {
  const {
    incidentTableState, incidentTableColumns,
  } = incidentTable;
  const {
    status,
  } = incidentActions;
  const {
    filteredIncidentsByQuery, fetchingIncidents,
  } = incidents;
  const {
    displayConfirmQueryModal,
  } = querySettings;
  const {
    currentUserLocale,
  } = users;

  // React Table Config
  const defaultColumn = useMemo(
    () => ({
      minWidth: 30,
      width: 150,
      maxWidth: 1600,
    }),
    [],
  );

  const memoizedColumns = useMemo(() => {
    const tempReactTableColumns = getReactTableColumnSchemas(incidentTableColumns).map((col) => {
      // Monkeypatch for i18n
      const tempCol = { ...col };
      tempCol.Header = i18next.t(col.Header);
      return tempCol;
    });
    return tempReactTableColumns;
  }, [incidentTableColumns, currentUserLocale]);

  const scrollBarSize = useMemo(() => scrollbarWidth(), []);

  // Dynamic Table Height
  const querySettingsEl = document.getElementById('query-settings-ctr');
  const incidentActionsEl = document.getElementById('incident-actions-ctr');
  const incidentActionsHeight = incidentActionsEl ? mezr.height(incidentActionsEl) + 50 : 0;
  const distanceBetweenQueryAndAction = incidentActionsEl
    ? mezr.distance([querySettingsEl, 'border'], [incidentActionsEl, 'border'])
    : 0;

  // Debouncing for table state
  const debouncedUpdateIncidentTableState = useDebouncedCallback((state, action) => {
    // Only update store with sorted and column resizing state
    if (action.type === 'toggleSortBy' || action.type === 'columnDoneResizing') {
      updateIncidentTableState(state);
    }
  }, 1000);

  // Custom row id fetch to handle dynamic table updates
  const getRowId = useCallback((row) => row.id, []);

  // Create instance of react-table with options and plugins
  const {
    state: {
      selectedRowIds,
    },
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    selectedFlatRows,
    toggleAllRowsSelected,
    totalColumnsWidth,
  } = useTable(
    {
      columns: memoizedColumns,
      data: filteredIncidentsByQuery, // Potential issue with Memoization hook?
      defaultColumn,
      getRowId,
      // Prevent re-render when redux store updates
      autoResetPage: false,
      autoResetExpanded: false,
      autoResetGroupBy: false,
      autoResetSelectedRows: false,
      autoResetSortBy: false,
      autoResetFilters: false,
      autoResetRowState: false,
      // Enable multisort without specific event handler (i.e. shift+click)
      isMultiSortEvent: () => true,
      // Set initial state from store
      initialState: incidentTableState,
      // Handle updates to table
      stateReducer: (newState, action) => debouncedUpdateIncidentTableState(newState, action),
    },
    // Plugins
    useSortBy,
    useRowSelect,
    useBlockLayout,
    useResizeColumns,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        // Let's make a column for selection
        {
          id: 'selection',
          disableResizing: true,
          minWidth: 35,
          width: 35,
          maxWidth: 35,
          Header: ({
            getToggleAllRowsSelectedProps,
          }) => (
            <div>
              <CheckboxComponent id="all-incidents-checkbox" {...getToggleAllRowsSelectedProps()} />
            </div>
          ),
          Cell: ({
            row,
          }) => (
            <div>
              <CheckboxComponent
                data-incident-row-idx={row.index}
                data-incident-id={row.original.id}
                {...row.getToggleRowSelectedProps()}
              />
            </div>
          ),
        },
        ...columns,
      ]);
    },
  );

  // Custom component required for virtualized rows
  const RenderRow = useCallback(
    ({
      index, style,
    }) => {
      const row = rows[index];
      prepareRow(row);
      return (
        <tr
          {...row.getRowProps({
            style,
          })}
          className={index % 2 === 0 ? 'tr' : 'tr-odd'}
        >
          {row.cells.map((cell) => (
            <td
              {...cell.getCellProps()}
              className="td"
              data-incident-header={cell.column.Header}
              data-incident-row-cell-idx={row.index}
              data-incident-cell-id={row.original.id}
            >
              {cell.render('Cell')}
            </td>
          ))}
        </tr>
      );
    },
    [prepareRow, rows, selectedRowIds],
  );

  // Row selection hooks
  useEffect(() => {
    const selectedRows = selectedFlatRows.map((row) => row.original);
    selectIncidentTableRows(true, selectedRows.length, selectedRows);
    return () => {};
  }, [selectedFlatRows]);

  // Handle deselecting rows after incident action has completed
  useEffect(() => {
    // TODO: Get user feedback on this workflow
    if (!status.includes('TOGGLE') && status.includes('COMPLETED')) toggleAllRowsSelected(false);
  }, [status]);

  // Render components based on application state
  if (displayConfirmQueryModal) {
    return <></>;
  }

  if (!displayConfirmQueryModal && querySettings.error) {
    return <QueryCancelledComponent />;
  }

  if (fetchingIncidents) {
    return <QueryActiveComponent />;
  }

  // TODO: Find a better way to prevent Empty Incidents from being shown during render
  if (!fetchingIncidents && filteredIncidentsByQuery.length === 0) {
    return (
      <Delayed waitBeforeShow={4000}>
        <EmptyIncidentsComponent />
      </Delayed>
    );
  }

  if (!fetchingIncidents && filteredIncidentsByQuery.length > 0) {
    return (
      <div className="incident-table-ctr">
        <div className="incident-table">
          <BTable responsive="sm" hover size="sm" {...getTableProps()}>
            <table className="table">
              <thead className="thead">
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        data-column-name={column.Header}
                        className={column.isSorted ? 'th-sorted' : 'th'}
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                      >
                        {column.render('Header')}
                        <span>{column.isSorted ? (column.isSortedDesc ? ' ▼' : ' ▲') : ''}</span>
                        {column.canResize && (
                          <div
                            {...column.getResizerProps()}
                            className={`resizer ${column.isResizing ? 'isResizing' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()} className="tbody">
                <FixedSizeList
                  className="incident-table-fixed-list"
                  height={distanceBetweenQueryAndAction - incidentActionsHeight}
                  itemCount={rows.length}
                  itemSize={60}
                  width={totalColumnsWidth + scrollBarSize}
                >
                  {RenderRow}
                </FixedSizeList>
              </tbody>
            </table>
          </BTable>
        </div>
      </div>
    );
  }
};

const mapStateToProps = (state) => ({
  incidentTable: state.incidentTable,
  incidentActions: state.incidentActions,
  incidents: state.incidents,
  querySettings: state.querySettings,
  users: state.users,
});

const mapDispatchToProps = (dispatch) => ({
  selectIncidentTableRows: (allSelected, selectedCount, selectedRows) => {
    dispatch(selectIncidentTableRowsConnected(allSelected, selectedCount, selectedRows));
  },
  updateIncidentTableState: (incidentTableState) => {
    dispatch(updateIncidentTableStateConnected(incidentTableState));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(IncidentTableComponent);
