"use client";

import { useReducer, useCallback } from "react";

export type AuthStep =
  | "EMAIL"
  | "LOGIN_PASSWORD"
  | "SIGNUP_DETAILS"
  | "SUCCESS";

export interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  role: "client" | "developer";
}

export interface AuthState {
  step: AuthStep;
  mode: "login" | "signup";
  email: string;
  firstName: string;
  isLoading: boolean;
  error: string | null;
  userData: Partial<RegisterData>;
}

type AuthAction =
  | { type: "SET_EMAIL"; email: string }
  | { type: "USER_EXISTS"; firstName?: string }
  | { type: "USER_NEW" }
  | { type: "SET_USER_DATA"; data: Partial<RegisterData> }
  | { type: "AUTH_SUCCESS" }
  | { type: "SET_ERROR"; message: string | null }
  | { type: "LOADING"; value: boolean }
  | { type: "RESET" };

const initialState: AuthState = {
  step: "EMAIL",
  mode: "login",
  email: "",
  firstName: "",
  isLoading: false,
  error: null,
  userData: {},
};

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.email, error: null };
    case "USER_EXISTS":
      return { ...state, step: "LOGIN_PASSWORD", mode: "login", firstName: action.firstName ?? "", error: null };
    case "USER_NEW":
      return { ...state, step: "SIGNUP_DETAILS", mode: "signup", error: null };
    case "SET_USER_DATA":
      return { ...state, userData: { ...state.userData, ...action.data } };
    case "AUTH_SUCCESS":
      return { ...state, step: "SUCCESS", error: null, isLoading: false };
    case "SET_ERROR":
      return { ...state, error: action.message, isLoading: false };
    case "LOADING":
      return { ...state, isLoading: action.value, error: action.value ? null : state.error };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

export function useAuthFlow(initialMode: "login" | "signup" = "login") {
  const [state, dispatch] = useReducer(reducer, { ...initialState, mode: initialMode });

  const setEmail       = useCallback((email: string) => dispatch({ type: "SET_EMAIL", email }), []);
  const setUserExists  = useCallback((firstName?: string) => dispatch({ type: "USER_EXISTS", firstName }), []);
  const setUserNew     = useCallback(() => dispatch({ type: "USER_NEW" }), []);
  const setUserData    = useCallback((data: Partial<RegisterData>) => dispatch({ type: "SET_USER_DATA", data }), []);
  const setAuthSuccess = useCallback(() => dispatch({ type: "AUTH_SUCCESS" }), []);
  const setError       = useCallback((message: string | null) => dispatch({ type: "SET_ERROR", message }), []);
  const setLoading     = useCallback((value: boolean) => dispatch({ type: "LOADING", value }), []);
  const reset          = useCallback(() => dispatch({ type: "RESET" }), []);

  // Keep setOtpVerified as alias for backward compat
  const setOtpVerified = setAuthSuccess;

  return { state, setEmail, setUserExists, setUserNew, setUserData, setAuthSuccess, setOtpVerified, setError, setLoading, reset };
}
