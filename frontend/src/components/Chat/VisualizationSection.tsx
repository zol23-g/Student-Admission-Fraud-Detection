import React from "react";
import { QueryResultRow } from "../../utils/queryResultRow";
import {
  BarChartVisualization,
  PieChartVisualization,
} from "../visualizations/ChartVisualizations";
import {
  determineVisualizationType,
  generateVisualizationConfig,
} from "../../utils/queryResultRow";

interface VisualizationSectionProps {
  results: QueryResultRow[];
  content: string;
}

const VisualizationSection: React.FC<VisualizationSectionProps> = ({
  results,
  content,
}) => {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Data Visualization:
      </h4>
      {determineVisualizationType(results) === "bar" ? (
        <BarChartVisualization
          config={generateVisualizationConfig(results, content)}
        />
      ) : determineVisualizationType(results) === "pie" ? (
        <PieChartVisualization
          config={generateVisualizationConfig(results, content)}
        />
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            Table view is most appropriate for this data
          </p>
        </div>
      )}
    </div>
  );
};

export default VisualizationSection;