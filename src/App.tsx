import React, { useState, useCallback } from 'react';
import { TreeView } from './components/TreeView';
import { FileUpload } from './components/FileUpload';
import { TPTreeData, TreeNodeDisplay, TreeNodeData } from './types';
import { transformTreeData } from './utils/treeTransform';

function App() {
  const [treeData, setTreeData] = useState<TreeNodeDisplay[] | null>(null);
  const [metadata, setMetadata] = useState<{ version: string; timestamp: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDataLoad = useCallback((data: TPTreeData | TreeNodeData[]) => {
    try {
      setError(null);

      let events: TreeNodeData[];
      let meta: { version: string; timestamp: string };

      if (Array.isArray(data)) {
        // Raw events array (from stdin)
        events = data;
        meta = { version: 'unknown', timestamp: new Date().toISOString() };
      } else {
        // Full TPTreeData object (from file)
        events = data.events;
        meta = { version: data.version, timestamp: data.timestamp };
      }

      const transformedData = transformTreeData(events);
      setTreeData(transformedData);
      setMetadata(meta);
    } catch (err) {
      setError(`Failed to process tree data: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const handleReset = useCallback(() => {
    setTreeData(null);
    setMetadata(null);
    setError(null);
  }, []);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-bold mb-1">TP Tree Viewer</h1>
        <p className="text-gray-400 text-sm">
          Interactive visualization for Ruby method call trees
        </p>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-6 overflow-hidden">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <h3 className="font-semibold text-red-300 mb-2">Error</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {!treeData ? (
          <div className="max-w-4xl mx-auto">
            <FileUpload onDataLoad={handleDataLoad} />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Metadata bar */}
            <div className="mb-6 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-400">
                {metadata && (
                  <>
                    <span>Version: {metadata.version}</span>
                    <span className="ml-4">Generated: {new Date(metadata.timestamp).toLocaleString()}</span>
                  </>
                )}
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
              >
                Load New Data
              </button>
            </div>

            {/* TreeView takes remaining space */}
            <div className="flex-1 overflow-hidden">
              <TreeView data={treeData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;