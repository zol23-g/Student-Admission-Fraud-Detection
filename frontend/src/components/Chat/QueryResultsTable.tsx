import React from "react";
import { QueryResultRow } from "../../utils/queryResultRow";

interface QueryResultsTableProps {
  results: QueryResultRow[] | string | null;
}

const QueryResultsTable: React.FC<QueryResultsTableProps> = ({ results }) => {
  if (!results || (Array.isArray(results) && results.length === 0)) return null;
  if (!Array.isArray(results)) return null;

  const columns = Object.keys(results[0]);

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((row: QueryResultRow, rowIndex: number) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {columns.map((col) => (
                    <td
                      key={`${rowIndex}-${col}`}
                      className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis"
                    >
                      {typeof row[col] === "object"
                        ? JSON.stringify(row[col])
                        : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-gray-500 px-4 py-2 text-right bg-gray-50">
            Showing {results.length} row{results.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryResultsTable;