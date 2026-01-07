/**
 * Data Preview Component
 * Displays Excel data in a table format with statistics
 */

import React from 'react';

const DataPreview = ({ excelData }) => {
  if (!excelData || excelData.length === 0) return null;

  return (
    <div className="data-preview">
      <h3>Data Preview</h3>
      <div className="data-stats">
        <span>Rows: {excelData.length}</span>
        <span>Columns: {Object.keys(excelData[0] || {}).length}</span>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {Object.keys(excelData[0] || {}).map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {excelData.slice(0, 5).map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex}>{String(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {excelData.length > 5 && (
          <p className="table-note">Showing first 5 rows of {excelData.length} total rows</p>
        )}
      </div>
    </div>
  );
};

export default DataPreview;
