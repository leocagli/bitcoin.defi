'use client';

import { useState } from 'react';
import type { Strategy } from '@/types/strategy';
import { StrategyCard } from '@/components/dashboard/StrategyCard';

type Props = {
  strategies: Strategy[];
  activeId?: string;
  onSelect?: (strategy: Strategy) => void;
};

export function StrategyList({ strategies, activeId, onSelect }: Props) {
  const [internalActiveId, setInternalActiveId] = useState(activeId ?? strategies[0]?.id ?? '');

  const handleSelect = (strategy: Strategy) => {
    setInternalActiveId(strategy.id);
    onSelect?.(strategy);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {strategies.map((strategy, index) => (
        <StrategyCard
          key={strategy.id}
          strategy={strategy}
          index={index}
          isActive={strategy.id === internalActiveId}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
