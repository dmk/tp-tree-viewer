export interface TreeNodeData {
  event: 'call' | 'return' | 'call_return';
  method_name: string;
  parameters: Parameter[] | null;
  return_value: any;
  depth: number;
  defined_class: string | null;
  path: string | null;
  lineno: number | null;
  start_time: number | null;
  end_time: number | null;
  duration: number | null;
}

export interface Parameter {
  type: string;
  name: string;
  value: any;
}

export interface TPTreeData {
  version: string;
  timestamp: string;
  events: TreeNodeData[];
}

export interface TreeNodeDisplay extends TreeNodeData {
  id: string;
  children: TreeNodeDisplay[];
  isExpanded: boolean;
  level: number;
  parent?: TreeNodeDisplay;
}