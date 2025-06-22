import { TreeNodeData, TreeNodeDisplay } from '../types';

export function transformTreeData(events: TreeNodeData[]): TreeNodeDisplay[] {
  const nodes: TreeNodeDisplay[] = [];
  const stack: TreeNodeDisplay[] = [];
  const callStack: { [key: string]: TreeNodeDisplay } = {};

  events.forEach((event, index) => {
    // Skip return events - we'll merge them with their corresponding calls
    if (event.event === 'return') {
      // Find the corresponding call and merge the return value
      const callKey = `${event.depth}-${event.method_name}`;
      const callNode = callStack[callKey];
      if (callNode) {
        callNode.return_value = event.return_value;
        callNode.end_time = event.end_time;
        callNode.duration = event.duration;
        delete callStack[callKey];
      }
      return;
    }

    const node: TreeNodeDisplay = {
      ...event,
      id: `node-${index}`,
      children: [],
      isExpanded: true,
      level: event.depth,
    };

    // Find the correct parent based on depth
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      const popped = stack.pop();
      if (popped) {
        const key = `${popped.depth}-${popped.method_name}`;
        delete callStack[key];
      }
    }

    if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      parent.children.push(node);
      node.parent = parent;
    } else {
      nodes.push(node);
    }

    // For 'call' events, track them for potential merging with return
    if (event.event === 'call') {
      const callKey = `${event.depth}-${event.method_name}`;
      callStack[callKey] = node;
    }

    // Push all non-return events to stack (things that can have children)
    stack.push(node);
  });

  return nodes;
}

export function flattenTree(nodes: TreeNodeDisplay[]): TreeNodeDisplay[] {
  const result: TreeNodeDisplay[] = [];

  function traverse(nodeList: TreeNodeDisplay[]) {
    for (const node of nodeList) {
      result.push(node);
      if (node.isExpanded && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return result;
}

export function formatDuration(duration: number | null): string {
  if (duration === null) return '';

  if (duration < 0.001) {
    return `${(duration * 1_000_000).toFixed(1)}μs`;
  } else if (duration < 1.0) {
    return `${(duration * 1000).toFixed(1)}ms`;
  } else {
    return `${duration.toFixed(3)}s`;
  }
}

export function formatParameters(parameters: any): string {
  if (!parameters || !Array.isArray(parameters)) return '';

  if (parameters.length === 0) return '';
  if (parameters.length > 3) {
    // Show first 2 params and count
    const first = parameters.slice(0, 2).map(param => {
      const { type, name, value } = param;
      switch (type) {
        case 'req':
        case 'opt':
          return `${name} = ${formatValue(value, 25)}`;
        case 'keyreq':
        case 'key':
          return value === null ? `${name}:` : `${name} = ${formatValue(value, 25)}`;
        case 'rest':
          return `*${name}`;
        case 'keyrest':
          return `**${name}`;
        case 'block':
          return `&${name}`;
        default:
          return String(name);
      }
    }).join(', ');
    return `${first}, ... +${parameters.length - 2} more`;
  }

  return parameters.map(param => {
    const { type, name, value } = param;
    switch (type) {
      case 'req':
      case 'opt':
        return `${name} = ${formatValue(value, 30)}`;
      case 'keyreq':
      case 'key':
        return value === null ? `${name}:` : `${name} = ${formatValue(value, 30)}`;
      case 'rest':
        return `*${name}`;
      case 'keyrest':
        return `**${name}`;
      case 'block':
        return `&${name}`;
      default:
        return String(name);
    }
  }).join(', ');
}

export function formatValueFull(value: any): string {
  if (value === null) return 'nil';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'symbol') return `:${String(value)}`;

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map(v => formatValueFull(v)).join(',\n  ');
    return `[\n  ${items}\n]`;
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const items = entries.map(([k, v]) => `${JSON.stringify(k)}: ${formatValueFull(v)}`).join(',\n  ');
    return `{\n  ${items}\n}`;
  }

  return String(value);
}

export function formatParametersFull(parameters: any): string {
  if (!parameters || !Array.isArray(parameters)) return '';

  return parameters.map(param => {
    const { type, name, value } = param;
    switch (type) {
      case 'req':
      case 'opt':
        return `${name} = ${formatValueFull(value)}`;
      case 'keyreq':
      case 'key':
        return value === null ? `${name}:` : `${name} = ${formatValueFull(value)}`;
      case 'rest':
        return `*${name}`;
      case 'keyrest':
        return `**${name}`;
      case 'block':
        return `&${name}`;
      default:
        return String(name);
    }
  }).join(',\n');
}

export function formatValue(value: any, maxLength: number = 50): string {
  if (value === null) return 'nil';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);

  if (typeof value === 'string') {
    const quoted = JSON.stringify(value);
    return quoted.length > maxLength ? `${quoted.slice(0, maxLength-3)}..."` : quoted;
  }

  if (typeof value === 'symbol') return `:${String(value)}`;

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length === 1) return `[${formatValue(value[0], 20)}]`;
    return `[${formatValue(value[0], 15)}, ... +${value.length - 1} more]`;
  }

  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    if (keys.length === 1) {
      const [k] = keys;
      const formatted = `{${k}: ${formatValue(value[k], 20)}}`;
      return formatted.length > maxLength ? `{${k}: ...}` : formatted;
    }
    return `{${keys[0]}: ..., +${keys.length - 1} more}`;
  }

  const str = String(value);
  return str.length > maxLength ? `${str.slice(0, maxLength-3)}...` : str;
}