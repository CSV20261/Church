'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface HierarchyNodeData {
  label: string;
  level: string;
  levelLabel: string;
  leader: string;
  location?: string;
  colors: {
    bg: string;
    border: string;
    text: string;
  };
  rawData: any;
}

function HierarchyNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as HierarchyNodeData;
  const { label, levelLabel, leader, location, colors } = nodeData;

  return (
    <>
      {/* Input handle (top) - for receiving connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400"
      />
      
      <div
        className={`px-4 py-3 rounded-lg shadow-md min-w-[200px] max-w-[250px] cursor-pointer transition-all ${
          selected ? 'ring-2 ring-offset-2 ring-green-500' : ''
        }`}
        style={{
          backgroundColor: colors.bg,
          borderWidth: 2,
          borderColor: colors.border,
          borderStyle: 'solid',
        }}
      >
        {/* Level badge */}
        <div 
          className="text-[10px] font-semibold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full inline-block"
          style={{ 
            backgroundColor: colors.border,
            color: 'white',
          }}
        >
          {levelLabel}
        </div>
        
        {/* Name */}
        <h3 
          className="font-bold text-sm truncate"
          style={{ color: colors.text }}
        >
          {label}
        </h3>
        
        {/* Leader */}
        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
          <span>👤</span>
          <span className="truncate">{leader}</span>
        </p>
        
        {/* Location (if available) */}
        {location && (
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <span>📍</span>
            <span className="truncate">{location}</span>
          </p>
        )}
      </div>

      {/* Output handle (bottom) - for sending connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400"
      />
    </>
  );
}

export default memo(HierarchyNode);
