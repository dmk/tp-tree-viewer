import React, { useState, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight, ChevronDown, Clock, Code, FileText, BarChart3 } from 'lucide-react';
import { TreeNodeDisplay } from '../types';
import { formatDuration, formatParameters, formatValue, formatParametersFull, formatValueFull } from '../utils/treeTransform';
import { PerformanceAnalysis } from './PerformanceAnalysis';

interface TreeViewProps {
  data: TreeNodeDisplay[];
}

const DEPTH_COLORS = [
  'text-green-400',
  'text-blue-400',
  'text-yellow-400',
  'text-pink-400',
  'text-cyan-400',
  'text-red-400'
];

export function TreeView({ data }: TreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFiltered, setShowOnlyFiltered] = useState(false);
  const [activeTab, setActiveTab] = useState<'tree' | 'performance'>('tree');

  // Initialize only root level nodes as expanded for performance
  React.useEffect(() => {
    const rootNodeIds = new Set<string>();
    data.forEach(node => {
      rootNodeIds.add(node.id);
    });
    setExpandedNodes(rootNodeIds);
  }, [data]);

    // Optimized visible nodes calculation with search filtering
  const visibleNodes = useMemo(() => {
    const result: TreeNodeDisplay[] = [];
    const searchLower = searchTerm.toLowerCase();

    function traverse(nodes: TreeNodeDisplay[]) {
      for (const node of nodes) {
        const matchesSearch = !searchTerm ||
          node.method_name.toLowerCase().includes(searchLower) ||
          node.defined_class?.toLowerCase().includes(searchLower);

        if (!showOnlyFiltered || matchesSearch) {
          result.push(node);
        }

        if (expandedNodes.has(node.id) && node.children.length > 0) {
          traverse(node.children);
        }
      }
    }

    traverse(data);
    return result;
  }, [data, expandedNodes, searchTerm, showOnlyFiltered]);

    // Virtualization setup
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: visibleNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Increased height per item for better readability
    overscan: 10, // Render 10 extra items outside viewport
  });

  // Re-measure when tab changes to fix virtualization
  React.useEffect(() => {
    if (activeTab === 'tree') {
      virtualizer.measure();
    }
  }, [activeTab, virtualizer]);

  const toggleExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const getDepthColor = useCallback((depth: number) => {
    return DEPTH_COLORS[depth % DEPTH_COLORS.length];
  }, []);

      const TreeNodeItem = React.memo(({ node, isSelected, onSelect }: {
    node: TreeNodeDisplay;
    isSelected: boolean;
    onSelect: (id: string) => void;
  }) => {
    const depthColor = getDepthColor(node.depth);
    const duration = formatDuration(node.duration);

            const renderContent = () => {
      const hasReturnValue = node.return_value !== null && node.return_value !== undefined;

      return (
        <div className="flex items-center gap-1 min-w-0 font-mono text-sm">
          <span className={`${depthColor} font-semibold flex-shrink-0`}>{node.method_name}</span>
          <span className="text-gray-400">(</span>
          <span className="text-gray-300 truncate">{formatParameters(node.parameters)}</span>
          <span className="text-gray-400">)</span>
          {hasReturnValue && (
            <>
              <span className="text-gray-400 mx-1">→</span>
              <span className="text-orange-400 truncate">{formatValue(node.return_value, 30)}</span>
            </>
          )}
          {duration && <span className="text-cyan-400 text-xs ml-2 flex-shrink-0 bg-gray-800 px-1 py-0.5 rounded">[{duration}]</span>}
        </div>
      );
    };

    return (
      <div
        className={`flex items-center cursor-pointer hover:bg-gray-700 py-2 px-2 rounded mb-1 transition-colors ${
          isSelected ? 'bg-gray-700' : ''
        }`}
        onClick={() => onSelect(node.id)}
      >
        <div className="flex items-center">
          {/* Depth lines */}
          {Array.from({ length: node.depth }, (_, i) => (
            <div
              key={`depth-${i}`}
              className="w-4 border-l-2 border-gray-600 mr-2"
              style={{ height: '24px' }}
            />
          ))}

          {/* Expansion control */}
          {node.children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion(node.id);
              }}
              className={`${depthColor} hover:text-white mr-2 p-1 rounded`}
            >
              {expandedNodes.has(node.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-6 mr-2 flex justify-center">
              <div className={`w-2 h-2 rounded-full ${depthColor.replace('text-', 'bg-').replace('-400', '-600')}`} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 ml-2">
          {renderContent()}
        </div>
      </div>
    );
  });

    const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
  }, []);

  const selectedNodeData = useMemo(() =>
    selectedNode ? visibleNodes.find(n => n.id === selectedNode) : null,
    [selectedNode, visibleNodes]
  );

    return (
    <div className="flex gap-6 h-full">
      {/* Main Panel */}
      <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden flex flex-col">
        {/* Tab Headers and Controls */}
        <div className="border-b border-gray-700 flex-shrink-0">
          {/* Tab Headers */}
          <div className="flex">
            <button
              onClick={() => setActiveTab('tree')}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'tree'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Code className="w-4 h-4 mr-2" />
              Call Tree
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Performance
            </button>
          </div>

          {/* Search and Filter Controls - only show for tree tab */}
          {activeTab === 'tree' && (
            <div className="p-4">
              {/* Search and Filter Controls */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Search methods or classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                />
                <label className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={showOnlyFiltered}
                    onChange={(e) => setShowOnlyFiltered(e.target.checked)}
                    className="mr-2"
                  />
                  Filter only
                </label>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>{visibleNodes.length} events shown</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const allIds = new Set<string>();
                      function collect(nodes: TreeNodeDisplay[]) {
                        nodes.forEach(node => {
                          if (node.children.length > 0) allIds.add(node.id);
                          collect(node.children);
                        });
                      }
                      collect(data);
                      setExpandedNodes(allIds);
                    }}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setExpandedNodes(new Set())}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                  >
                    Collapse All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Content - takes remaining height */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'tree' ? (
            <div
              ref={parentRef}
              className="h-full overflow-auto"
            >
              {visibleNodes.length > 0 ? (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const node = visibleNodes[virtualItem.index];
                    if (!node) return null;

                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start + 16}px)`, // Add padding offset
                          paddingLeft: '16px',
                          paddingRight: '16px',
                        }}
                        className="font-mono"
                      >
                        <TreeNodeItem
                          node={node}
                          isSelected={selectedNode === node.id}
                          onSelect={handleNodeSelect}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-400">
                  {searchTerm || showOnlyFiltered ? 'No matching events found' : 'No events to display'}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-auto p-4">
              <PerformanceAnalysis data={data} onNodeSelect={handleNodeSelect} />
            </div>
          )}
        </div>
      </div>

      {/* Details Panel */}
      <div className="w-80 bg-gray-800 rounded-lg flex flex-col">
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Node Details
          </h3>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {selectedNodeData ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Method</label>
                <div className={`font-mono ${getDepthColor(selectedNodeData.depth)}`}>
                  {selectedNodeData.method_name}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">Call Type</label>
                <div className="font-mono text-blue-400">
                  {selectedNodeData.event === 'call_return' ? 'Leaf Call' :
                   selectedNodeData.return_value !== null ? 'Call with Return' : 'Call'}
                </div>
              </div>

              {selectedNodeData.defined_class && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Class</label>
                  <div className="font-mono text-green-400">
                    {selectedNodeData.defined_class}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-400">Depth</label>
                <div className="font-mono">
                  {selectedNodeData.depth}
                </div>
              </div>

              {selectedNodeData.duration && (
                <div>
                  <label className="text-sm font-medium text-gray-400 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Duration
                  </label>
                  <div className="font-mono text-cyan-400">
                    {formatDuration(selectedNodeData.duration)}
                  </div>
                </div>
              )}

              {selectedNodeData.parameters && selectedNodeData.parameters.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Parameters ({selectedNodeData.parameters.length})
                  </label>
                  <div className="space-y-2">
                    {selectedNodeData.parameters.map((param, index) => (
                      <div key={index} className="bg-gray-900 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 bg-gray-700 px-2 py-1 rounded">
                            {param.type}
                          </span>
                          {param.name && (
                            <span className="font-mono text-sm text-blue-400">
                              {param.name}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-sm text-gray-300 max-h-32 overflow-auto whitespace-pre-wrap">
                          {formatValueFull(param.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNodeData.return_value !== null && selectedNodeData.return_value !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">Return Value</label>
                  <div className="font-mono text-sm text-orange-400 bg-gray-900 p-3 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                    {formatValueFull(selectedNodeData.return_value)}
                  </div>
                </div>
              )}

              {selectedNodeData.path && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Location</label>
                  <div className="font-mono text-sm text-gray-300">
                    {selectedNodeData.path}
                    {selectedNodeData.lineno && `:${selectedNodeData.lineno}`}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Select a node to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}