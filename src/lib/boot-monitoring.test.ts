import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { bootMonitoringScript } from "./boot-monitoring";

function harness(storage = new Map<string, string>(), fail = false) {
  const calls: Record<string, unknown>[] = [];
  const listeners: Record<string, (event?: unknown) => void> = {};
  const timers: Array<{ fn: () => void; ms: number }> = [];
  const window: Record<string, any> = { addEventListener: (type: string, fn: () => void) => { listeners[type] = fn; } };
  let counter = 0;
  const context = {
    window,
    location: { pathname: "/privacy", search: "?email=private", hash: "#secret" },
    performance: { now: () => 13000 },
    crypto: { randomUUID: () => `test-${++counter}` },
    localStorage: { getItem: (k: string) => storage.get(k), setItem: (k: string, v: string) => storage.set(k, v) },
    setTimeout: (fn: () => void, ms: number) => { timers.push({ fn, ms }); return 1; },
    clearTimeout: () => {},
    document: {
      getElementById: () => ({ classList: { add: () => {} } }),
      addEventListener: (type: string, fn: () => void) => { listeners[`document:${type}`] = fn; },
    },
    fetch: async (_url: string, init: { body: string }) => {
      calls.push(JSON.parse(init.body));
      if (fail) throw new Error("offline");
      return { ok: true, status: 201 };
    },
  };
  runInNewContext(bootMonitoringScript("https://cloud.example", "public-key"), context);
  return { window, calls, listeners, timers, storage };
}

test("retry activates at 12 seconds and emits once without sensitive URL data", async () => {
  const h = harness();
  assert.equal(h.timers[0]?.ms, 12000);
  h.timers[0]?.fn();
  h.timers[0]?.fn();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.calls[0], { id: "test-1", event_type: "retry_shown", page: "privacy", elapsed_ms: 0, failure_kind: "none" });
});

test("script failure and recovery are recorded without exception text", async () => {
  const h = harness();
  h.listeners.error?.({ target: { tagName: "SCRIPT" }, message: "secret" });
  h.window.__tdBootReady();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.deepEqual(h.calls.map(x => [x.event_type, x.failure_kind]), [["load_failure", "script"], ["load_recovered", "none"]]);
  h.listeners.error?.({ target: { tagName: "SCRIPT" } });
  assert.equal(h.calls.length, 2);
});

test("normal loading sends no events", () => {
  const h = harness();
  h.window.__tdBootReady();
  h.timers[0]?.fn();
  assert.equal(h.calls.length, 0);
});

test("failed delivery persists and is retried once after reopening", async () => {
  const h = harness(new Map(), true);
  h.window.__tdRecordReliability("retry_clicked");
  await new Promise(resolve => setTimeout(resolve, 0));
  const next = harness(h.storage);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(next.calls.length, 1);
  assert.equal(next.calls[0]?.event_type, "retry_clicked");
  assert.deepEqual(JSON.parse(next.storage.get("td-reliability-v1") || "[]"), []);
});

test("invalid event categories do not transmit", () => {
  const h = harness();
  h.window.__tdRecordReliability("arbitrary");
  h.window.__tdRecordReliability("load_failure", "private message");
  assert.equal(h.calls.length, 0);
});