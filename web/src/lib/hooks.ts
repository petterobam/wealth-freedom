// React Hooks — API 数据获取与缓存（轻量 SWR 模式）
// 用于替代 store.ts 的直接 localStorage 读取

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchDashboard,
  fetchTransactions,
  fetchAccounts,
  fetchGoals,
  fetchBudgets,
  fetchInvestments,
  type DashboardData,
  type ApiTransaction,
  type ApiAccount,
  type ApiGoal,
  type ApiBudget,
  type ApiInvestment,
} from "./api";

/* ── 通用 hook ──────────────────────────── */

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function useApi<T>(fetcher: () => Promise<T>): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return { data, loading, error, refresh };
}

/* ── 各资源 hooks ───────────────────────── */

export function useDashboard() {
  return useApi<DashboardData>(fetchDashboard);
}

export function useTransactions() {
  return useApi<ApiTransaction[]>(fetchTransactions);
}

export function useAccounts() {
  return useApi<ApiAccount[]>(fetchAccounts);
}

export function useGoals() {
  return useApi<ApiGoal[]>(fetchGoals);
}

export function useBudgets() {
  return useApi<ApiBudget[]>(fetchBudgets);
}

export function useInvestments() {
  return useApi<ApiInvestment[]>(fetchInvestments);
}
