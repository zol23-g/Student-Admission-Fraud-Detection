// File: frontend/src/utils/queryResultRow.ts
export type QueryResultRow = Record<string, unknown>;

export type VisualizationType = 'bar' | 'pie' | 'line' | 'table';

export type VisualizationConfig = {
  type: VisualizationType;
  title: string;
  xAxis?: string;
  yAxis?: string;
  data: QueryResultRow[];
};

export type ChatItem = {
  message: string;
  explanation: string;
  sql_query?: string;
  query_results?: string;
  created_at: string;
  provider?: string;
};

export type ChatMessage = {
  role: "user" | "bot" | "error";
  content: string;
  timestamp: string;
  sqlQuery?: string;
  queryResults?: QueryResultRow[] | string | null;
  provider?: string;
};

export const determineVisualizationType = (results: QueryResultRow[]): VisualizationType => {
  if (!results?.length) return 'table';
  
  const columns = Object.keys(results[0]);
  if (columns.length !== 2) return 'table';

  const isNumeric = (val: unknown) => 
    typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)));
  
  const [firstVal, secondVal] = [results[0][columns[0]], results[0][columns[1]]];
  
  if (isNumeric(firstVal) || isNumeric(secondVal)) {
    return columns.some(col => col.toLowerCase().includes('count') || 
           col.toLowerCase().includes('percentage')) ? 'pie' : 'bar';
  }
  
  return 'table';
};

export const generateVisualizationConfig = (
  results: QueryResultRow[], 
  question: string
): VisualizationConfig => {
  const type = determineVisualizationType(results);
  const columns = Object.keys(results[0] || {});
  
  return {
    type,
    title: question,
    xAxis: columns[0],
    yAxis: columns.length > 1 ? columns[1] : undefined,
    data: results
  };
};