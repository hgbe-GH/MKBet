"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import type { BetSlipSelection } from "@/fixtures/sportsbook/types";

interface BetSlipState {
  selections: BetSlipSelection[];
  message: string;
}

type BetSlipAction =
  | { type: "toggle"; selection: BetSlipSelection }
  | { type: "remove"; marketId: string; outcomeId: string }
  | { type: "clear" };

interface BetSlipContextValue extends BetSlipState {
  toggleSelection(selection: BetSlipSelection): void;
  removeSelection(marketId: string, outcomeId: string): void;
  clearSelections(): void;
  isSelected(marketId: string, outcomeId: string): boolean;
}

const BetSlipContext = createContext<BetSlipContextValue | null>(null);

function reducer(state: BetSlipState, action: BetSlipAction): BetSlipState {
  if (action.type === "clear") {
    return { selections: [], message: "Ticket vidé." };
  }

  if (action.type === "remove") {
    return {
      selections: state.selections.filter(
        (selection) =>
          selection.marketId !== action.marketId ||
          selection.outcomeId !== action.outcomeId,
      ),
      message: "Sélection retirée du ticket.",
    };
  }

  const existing = state.selections.find(
    (selection) =>
      selection.marketId === action.selection.marketId &&
      selection.outcomeId === action.selection.outcomeId,
  );

  if (existing) {
    return {
      selections: state.selections.filter(
        (selection) =>
          selection.marketId !== action.selection.marketId ||
          selection.outcomeId !== action.selection.outcomeId,
      ),
      message: "Sélection retirée du ticket.",
    };
  }

  if (
    state.selections.some(
      (selection) => selection.marketId === action.selection.marketId,
    )
  ) {
    return {
      ...state,
      message: "Une seule issue peut être sélectionnée par marché.",
    };
  }

  if (state.selections.length >= 3) {
    return {
      ...state,
      message: "Un combiné MK Bet est limité à trois jambes.",
    };
  }

  return {
    selections: [...state.selections, action.selection],
    message: "Sélection ajoutée au ticket.",
  };
}

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    selections: [],
    message: "",
  });

  const toggleSelection = useCallback((selection: BetSlipSelection) => {
    dispatch({ type: "toggle", selection });
  }, []);

  const removeSelection = useCallback((marketId: string, outcomeId: string) => {
    dispatch({ type: "remove", marketId, outcomeId });
  }, []);

  const clearSelections = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const isSelected = useCallback(
    (marketId: string, outcomeId: string) =>
      state.selections.some(
        (selection) =>
          selection.marketId === marketId && selection.outcomeId === outcomeId,
      ),
    [state.selections],
  );

  const value = useMemo(
    () => ({
      ...state,
      toggleSelection,
      removeSelection,
      clearSelections,
      isSelected,
    }),
    [clearSelections, isSelected, removeSelection, state, toggleSelection],
  );

  return (
    <BetSlipContext.Provider value={value}>{children}</BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);

  if (!context) {
    throw new Error("useBetSlip must be used inside BetSlipProvider.");
  }

  return context;
}

export function useOptionalBetSlip() {
  return useContext(BetSlipContext);
}
