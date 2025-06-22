import React, { useMemo } from 'react';
import { Clock, TrendingUp, BarChart3, Zap, AlertTriangle } from 'lucide-react';
import { TreeNodeDisplay } from '../types';
import { formatDuration } from '../utils/treeTransform';

interface PerformanceAnalysisProps {
  data: TreeNodeDisplay[];
  onNodeSelect: (nodeId: string) => void;
}

interface MethodStats {
  method_name: string;
  class_name: string | null;
  total_time: number;
  call_count: number;
  average_time: number;
  max_time: number;
  min_time: number;
  node_ids: string[];
}

export function PerformanceAnalysis({ data, onNodeSelect }: PerformanceAnalysisProps) {
  const analysis = useMemo(() => {
    const methodStats: { [key: string]: MethodStats } = {};
    const allNodes: TreeNodeDisplay[] = [];

    // Flatten all nodes
    function collectNodes(nodes: TreeNodeDisplay[]) {
      nodes.forEach(node => {
        allNodes.push(node);
        collectNodes(node.children);
      });
    }
    collectNodes(data);

    // Analyze each method
    allNodes.forEach(node => {
      if (!node.duration || node.duration <= 0) return;

      const key = `${node.defined_class || 'Unknown'}#${node.method_name}`;

      if (!methodStats[key]) {
        methodStats[key] = {
          method_name: node.method_name,
          class_name: node.defined_class,
          total_time: 0,
          call_count: 0,
          average_time: 0,
          max_time: 0,
          min_time: Infinity,
          node_ids: []
        };
      }

      const stats = methodStats[key];
      stats.total_time += node.duration;
      stats.call_count += 1;
      stats.max_time = Math.max(stats.max_time, node.duration);
      stats.min_time = Math.min(stats.min_time, node.duration);
      stats.node_ids.push(node.id);
    });

    // Calculate averages
    Object.values(methodStats).forEach(stats => {
      stats.average_time = stats.total_time / stats.call_count;
      if (stats.min_time === Infinity) stats.min_time = 0;
    });

    // Sort by different criteria
    const byTotalTime = Object.values(methodStats)
      .sort((a, b) => b.total_time - a.total_time)
      .slice(0, 10);

    const byAverageTime = Object.values(methodStats)
      .filter(s => s.call_count >= 1)
      .sort((a, b) => b.average_time - a.average_time)
      .slice(0, 10);

    const byCallCount = Object.values(methodStats)
      .sort((a, b) => b.call_count - a.call_count)
      .slice(0, 10);

    const slowCalls = allNodes
      .filter(n => n.duration && n.duration > 0)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 15);

    const totalTime = allNodes.reduce((sum, n) => sum + (n.duration || 0), 0);

    return {
      byTotalTime,
      byAverageTime,
      byCallCount,
      slowCalls,
      totalTime,
      totalCalls: allNodes.length
    };
  }, [data]);

  const MethodCard = ({ stats, type }: { stats: MethodStats; type: string }) => (
    <div
      className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
      onClick={() => stats.node_ids[0] && onNodeSelect(stats.node_ids[0])}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm text-blue-400 truncate">
            {stats.method_name}
          </div>
          {stats.class_name && (
            <div className="text-xs text-gray-400 truncate">
              {stats.class_name}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
          {stats.call_count}x
        </div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">
          {type === 'total' && `Total: ${formatDuration(stats.total_time)}`}
          {type === 'average' && `Avg: ${formatDuration(stats.average_time)}`}
          {type === 'calls' && `${stats.call_count} calls`}
        </span>
        <span className="text-cyan-400">
          {formatDuration(type === 'average' ? stats.average_time : stats.total_time)}
        </span>
      </div>

      {type === 'average' && stats.max_time > stats.average_time * 2 && (
        <div className="flex items-center mt-1 text-xs text-yellow-400">
          <AlertTriangle className="w-3 h-3 mr-1" />
          High variance
        </div>
      )}
    </div>
  );

  const CallCard = ({ node }: { node: TreeNodeDisplay }) => (
    <div
      className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
      onClick={() => onNodeSelect(node.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm text-blue-400 truncate">
            {node.method_name}
          </div>
          {node.defined_class && (
            <div className="text-xs text-gray-400 truncate">
              {node.defined_class}
            </div>
          )}
        </div>
        <div className="text-cyan-400 text-sm flex-shrink-0">
          {formatDuration(node.duration || 0)}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Depth: {node.depth}</span>
        {(node.duration || 0) > analysis.totalTime * 0.1 && (
          <div className="flex items-center text-red-400">
            <Zap className="w-3 h-3 mr-1" />
            Hotspot
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-sm text-gray-400">Total Time</span>
          </div>
          <div className="text-lg font-mono text-white">
            {formatDuration(analysis.totalTime)}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <BarChart3 className="w-4 h-4 mr-2 text-green-400" />
            <span className="text-sm text-gray-400">Total Calls</span>
          </div>
          <div className="text-lg font-mono text-white">
            {analysis.totalCalls.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 mr-2 text-yellow-400" />
            <span className="text-sm text-gray-400">Avg/Call</span>
          </div>
          <div className="text-lg font-mono text-white">
            {formatDuration(analysis.totalTime / analysis.totalCalls)}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Zap className="w-4 h-4 mr-2 text-red-400" />
            <span className="text-sm text-gray-400">Slowest Call</span>
          </div>
          <div className="text-lg font-mono text-white">
            {analysis.slowCalls[0] ? formatDuration(analysis.slowCalls[0].duration || 0) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slowest Individual Calls */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-red-400" />
            Slowest Individual Calls
          </h3>
          <div className="space-y-2 max-h-80 overflow-auto">
            {analysis.slowCalls.map((node, i) => (
              <CallCard key={`${node.id}-${i}`} node={node} />
            ))}
          </div>
        </div>

        {/* Highest Total Time */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-400" />
            Highest Total Time
          </h3>
          <div className="space-y-2 max-h-80 overflow-auto">
            {analysis.byTotalTime.map((stats, i) => (
              <MethodCard key={`total-${i}`} stats={stats} type="total" />
            ))}
          </div>
        </div>

        {/* Slowest Average Time */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
            Slowest Average Time
          </h3>
          <div className="space-y-2 max-h-80 overflow-auto">
            {analysis.byAverageTime.map((stats, i) => (
              <MethodCard key={`avg-${i}`} stats={stats} type="average" />
            ))}
          </div>
        </div>

        {/* Most Called Methods */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
            Most Called Methods
          </h3>
          <div className="space-y-2 max-h-80 overflow-auto">
            {analysis.byCallCount.map((stats, i) => (
              <MethodCard key={`calls-${i}`} stats={stats} type="calls" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}