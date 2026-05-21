"use client";

const WORKSPACE_STORAGE_KEY = "auto-casestudy-workspace";

export function getClientWorkspaceId() {
  if (typeof window === "undefined") return "demo-workspace";
  const existing = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (existing) return existing;
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
  const created = `workspace_${randomId}`;
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, created);
  return created;
}

export function workspaceRequestHeaders(extra?: HeadersInit): HeadersInit {
  return {
    ...extra,
    "x-autocasestudy-workspace": getClientWorkspaceId()
  };
}
