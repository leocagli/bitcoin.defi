'use client';

import { useMemo, useState } from 'react';
import { strategies as strategyData } from '@/data/strategies';
import { Hero } from '@/components/dashboard/Hero';
import { OverviewStats } from '@/components/dashboard/OverviewStats';
import { StrategyList } from '@/components/dashboard/StrategyList';
import { BacktestChart } from '@/components/dashboard/BacktestChart';
import { RiskControls } from '@/components/dashboard/RiskControls';
import { AllocationPanel } from '@/components/dashboard/AllocationPanel';
import { AiSignalPanel } from '@/components/dashboard/AiSignalPanel';
import { QuickAllocateCard } from '@/components/dashboard/QuickAllocateCard';
import { PythOracleCard } from '@/components/dashboard/PythOracleCard';

export function Dashboard() {
  const [activeStrategyId, setActiveStrategyId] = useState(strategyData[0]?.id);

  const activeStrategy = useMemo(
    () => strategyData.find((strategy) => strategy.id === activeStrategyId) ?? strategyData[0],
    [activeStrategyId],
  );

  if (!activeStrategy) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-20 text-center text-slate-100">
        <h2 className="text-2xl font-semibold">No hay estrategias configuradas todavía.</h2>
        <p className="mt-2 text-sm text-slate-300/80">
          Creá una estrategia en Stacks para comenzar con el copy trading.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-12 lg:px-6 lg:py-16">
      <Hero />
      <OverviewStats strategies={strategyData} />
      <AiSignalPanel />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickAllocateCard />
        <PythOracleCard asset="BTC" />
      </div>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Traders con track verificado
            </h2>
            <p className="text-sm text-slate-300/80">
              Seleccioná un perfil para analizar sus métricas, backtests y controles de riesgo.
            </p>
          </div>
        </div>
        <StrategyList
          strategies={strategyData}
          activeId={activeStrategy.id}
          onSelect={(strategy) => setActiveStrategyId(strategy.id)}
        />
      </section>

      <BacktestChart strategy={activeStrategy} />
      <RiskControls strategy={activeStrategy} />
      <AllocationPanel strategy={activeStrategy} />
    </main>
  );
}
