import React, { useCallback, useState } from 'react';
import { Upload, FileJson, Terminal } from 'lucide-react';
import { TPTreeData, TreeNodeData } from '../types';

interface FileUploadProps {
  onDataLoad: (data: TPTreeData | TreeNodeData[]) => void;
}

export function FileUpload({ onDataLoad }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      onDataLoad(data);
    } catch (error) {
      alert(`Failed to parse JSON file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      handleFile(file);
    } else {
      alert('Please drop a JSON file');
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handlePasteData = useCallback(() => {
    const textData = prompt('Paste your JSON data here:');
    if (textData) {
      try {
        const data = JSON.parse(textData);
        onDataLoad(data);
      } catch (error) {
        alert(`Failed to parse JSON data: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }, [onDataLoad]);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-900/20'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <Upload className="w-12 h-12 mx-auto text-gray-400" />
        </div>

        <h3 className="text-xl font-semibold mb-2">Load Tree Data</h3>
        <p className="text-gray-400 mb-6">
          Drop a JSON file here or choose an option below
        </p>

        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FileJson className="w-4 h-4 mr-2" />
              {isLoading ? 'Loading...' : 'Choose JSON File'}
            </label>
          </div>

          <div className="text-gray-500">or</div>

          <button
            onClick={handlePasteData}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            disabled={isLoading}
          >
            <Terminal className="w-4 h-4 mr-2" />
            Paste JSON Data
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h4 className="font-semibold mb-2">How to generate data:</h4>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <div>
            <span className="text-gray-500"># Generate JSON data from Ruby:</span>
          </div>
          <div>
            <span className="text-blue-400">TPTree.catch</span>(write_to: <span className="text-green-400">'trace.json'</span>) {'{ your_code }'}
          </div>
          <div className="mt-3">
            <span className="text-gray-500"># Then upload the trace.json file above</span>
          </div>
        </div>
      </div>
    </div>
  );
}