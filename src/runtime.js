var LernProg = window.LernProg || (window.LernProg = {});

const EXECUTION_LIMIT = 200000;
const WHILE_LIMIT = 500;
const CALL_DEPTH_LIMIT = 50;
const runtimeFlags = (LernProg.runtimeFlags = LernProg.runtimeFlags || {});
const DEFAULT_CAPTURE_SNAPSHOTS = Boolean(runtimeFlags.captureSnapshots ?? false);
const DEFAULT_CAPTURE_OUTPUTS = Boolean(runtimeFlags.captureOutputs ?? true);
const DEFAULT_MAX_STEPS = Number.isFinite(runtimeFlags.maxSteps) ? Math.max(0, Number(runtimeFlags.maxSteps)) : Infinity;
const DEBUG_ENABLED = Boolean(runtimeFlags.debug);
const DEBUG_STEP_SAMPLE = Number.isFinite(runtimeFlags.debugStepSample)
  ? Math.max(0, Number(runtimeFlags.debugStepSample))
  : 5000;

function debugLog(...args) {
  if (!DEBUG_ENABLED) return;
  if (typeof console?.debug === "function") {
    console.debug("[LernProg:runtime]", ...args);
  } else if (typeof console?.log === "function") {
    console.log("[LernProg:runtime]", ...args);
  }
}

class ScopeManager {
  constructor() {
    this.frameCounter = 0;
    this.frames = [this.createFrame("Global", { isolated: true })];
  }

  createFrame(label, options = {}) {
    return {
      id: `frame-${++this.frameCounter}`,
      label,
      isolated: Boolean(options.isolated),
      variables: new Map()
    };
  }

  pushFrame(label, options) {
    const frame = this.createFrame(label, options);
    this.frames.push(frame);
    return frame;
  }

  popFrame() {
    if (this.frames.length > 1) {
      this.frames.pop();
    }
  }

  set(name, value) {
    if (!name) return;
    const current = this.frames[this.frames.length - 1];
    current.variables.set(name, cloneValue(value));
  }

  get(name) {
    if (!name) return undefined;
    for (let index = this.frames.length - 1; index >= 0; index -= 1) {
      const frame = this.frames[index];
      if (frame.variables.has(name)) {
        return frame.variables.get(name);
      }
    }
    return undefined;
  }

  toObject() {
    const result = {};
    let lastIsolatedIndex = 0;
    this.frames.forEach((frame, index) => {
      if (frame.isolated) lastIsolatedIndex = index;
    });
    this.frames.forEach((frame, index) => {
      if (index !== 0 && index < lastIsolatedIndex) return;
      frame.variables.forEach((value, key) => {
        result[key] = value;
      });
    });
    return result;
  }

  snapshot() {
    return this.frames.map((frame, index) => ({
      id: frame.id,
      label: frame.label,
      depth: index,
      active: index === this.frames.length - 1,
      variables: Array.from(frame.variables.entries()).map(([name, value]) => ({
        name,
        value: cloneValue(value)
      }))
    }));
  }
}

function createRunner(ast, options = {}) {
  const settings = createTraceSettings(options);
  const scope = new ScopeManager();
  const runtime = { output: [], errors: [] };
  const context = {
    scope,
    runtime,
    counters: { steps: 0, lastLog: 0 },
    functions: new Map(),
    namespace: [],
    callDepth: 0,
    settings,
    latestStep: null,
    truncated: false,
    canvasBuffer: []
  };
  collectFunctions(ast, context.functions);
  const iterator = executeBlocksGenerator(ast, context);
  const runner = {
    context,
    settings,
    finished: false,
    next() {
      if (this.finished) return { done: true, value: undefined };
      const result = iterator.next();
      if (result.done) {
        this.finished = true;
        return { done: true, value: undefined };
      }
      context.latestStep = result.value;
      return result;
    },
    drain() {
      let last = null;
      for (const step of this) {
        last = step;
      }
      return last;
    },
    [Symbol.iterator]() {
      return { next: () => this.next() };
    }
  };
  return runner;
}

function buildExecutionTrace(ast, options = {}) {
  const startedAt = Date.now();
  const runner = createRunner(ast, options);
  const steps = [];
  let lastStep = null;
  try {
    for (const step of runner) {
      lastStep = step;
      if (!runner.settings.fastMode) {
        steps.push(step);
      }
    }
  } catch (error) {
    runner.context.runtime.errors.push(error.message);
    debugLog("Trace error", error);
  }
  if (runner.settings.fastMode && lastStep) {
    steps.push(lastStep);
  }
  debugLog("Trace done", {
    steps: steps.length,
    totalSteps: runner.context.counters.steps,
    truncated: runner.context.truncated,
    errors: runner.context.runtime.errors.length,
    durationMs: Date.now() - startedAt
  });
  return {
    steps,
    output: runner.context.runtime.output,
    errors: runner.context.runtime.errors,
    truncated: runner.context.truncated,
    totalSteps: runner.context.counters.steps,
    canvasOps: [...runner.context.canvasBuffer]
  };
}

function* executeBlocksGenerator(blocks, context, control = createControl()) {
  for (const block of blocks) {
    context.counters.steps += 1;
    if (context.counters.steps > EXECUTION_LIMIT) {
      context.runtime.errors.push("Ausführung abgebrochen: zu viele Schritte (Limit 200000).");
      context.truncated = true;
      return;
    }
    if (context.settings.maxSteps !== Infinity && context.counters.steps > context.settings.maxSteps) {
      context.runtime.errors.push(
        `Ausführung abgebrochen: Schrittelimit von ${context.settings.maxSteps} erreicht.`
      );
      context.truncated = true;
      return;
    }
    logProgress(block, context);
    yield* executeBlockGenerator(block, context, control);
    if (control.shouldReturn) {
      return;
    }
  }
}

function createControl() {
  return { shouldReturn: false, shouldBreak: false, shouldContinue: false, value: undefined };
}

function* executeBlockGenerator(block, context, control = createControl()) {
  const handler = typeof LernProg.getBlockHandler === "function" ? LernProg.getBlockHandler(block.type) : null;
  if (!handler) {
    context.runtime.errors.push(`Blocktyp "${block.type}" wird noch nicht unterstützt.`);
    yield createStep(block, context, "Unbekannter Block", { canvasOps: [] });
    return;
  }
  const api = createHandlerApi(block, context, control);
  const result = handler(api);
  if (typeof result?.next === "function") {
    yield* result;
  }
}

function describeBlock(block) {
  const definition = typeof LernProg.getBlockDefinition === "function" ? LernProg.getBlockDefinition(block.type) : null;
  const descriptor = definition?.describe || definition?.label;
  if (typeof descriptor === "function") {
    return descriptor(block);
  }
  if (typeof descriptor === "string" && descriptor.trim()) {
    return descriptor;
  }
  return block.type;
}

function createStep(block, context, description, meta = {}) {
  const stepData = {
    blockId: block.id,
    blockType: block.type,
    description: description || describeBlock(block),
    snapshot: context.settings.captureSnapshots ? context.scope.snapshot() : null,
    output: context.settings.captureOutputs ? [...context.runtime.output] : [],
    errors: [...context.runtime.errors],
    canvasOps: meta.canvasOps || []
  };
  context.latestStep = stepData;
  return stepData;
}

function createHandlerApi(block, context, control) {
  const canvasOps = [];
  return {
    block,
    context,
    control,
    scope: context.scope,
    runtime: context.runtime,
    canvasOps,
    constants: { WHILE_LIMIT, CALL_DEPTH_LIMIT },
    evaluate(expr, fallback) {
      return evaluateExpressionSafe(expr, context.scope, context.runtime, fallback);
    },
    resolveTemplate(template) {
      return resolveTemplate(template, context.scope, context.runtime);
    },
    parseList(value) {
      return parseListInput(value);
    },
    formatValue(value) {
      return formatValue(value);
    },
    resolveColorValue(value) {
      return resolveColorValue(value, context.scope, context.runtime);
    },
    rgbToHex(r, g, b) {
      return rgbToHex(r, g, b);
    },
    namespace: context.namespace,
    queueCanvasOp(op) {
      if (op) {
        canvasOps.push(op);
        context.canvasBuffer.push(op);
      }
    },
    step(description, meta = {}) {
      return createStep(block, context, description, { canvasOps: [...canvasOps], ...meta });
    },
    executeChildren(children = block.children, childControl = control) {
      return executeBlocksGenerator(children || [], context, childControl);
    },
    createChildControl() {
      return createControl();
    }
  };
}

function createTraceSettings(options = {}) {
  const maxStepsValue = Number(options.maxSteps);
  const maxSteps = Number.isFinite(maxStepsValue) ? Math.max(0, maxStepsValue) : DEFAULT_MAX_STEPS;
  const fastMode = Boolean(options.fastMode);
  return {
    captureSnapshots: options.captureSnapshots ?? (fastMode ? false : DEFAULT_CAPTURE_SNAPSHOTS),
    captureOutputs: options.captureOutputs ?? (fastMode ? false : DEFAULT_CAPTURE_OUTPUTS),
    fastMode,
    maxSteps
  };
}

function logProgress(block, context) {
  if (!DEBUG_ENABLED) return;
  if (!DEBUG_STEP_SAMPLE) return;
  if (context.counters.steps - context.counters.lastLog < DEBUG_STEP_SAMPLE) return;
  context.counters.lastLog = context.counters.steps;
  debugLog("Progress", {
    step: context.counters.steps,
    blockId: block?.id,
    blockType: block?.type
  });
}

function evaluateExpressionSafe(expression, scope, runtime, fallback) {
  const trimmed = expression?.trim();
  if (!trimmed) return fallback;
  try {
    return evaluateExpression(trimmed, scope);
  } catch (error) {
    runtime.errors.push(`Fehler in Ausdruck "${trimmed}": ${error.message}`);
    return fallback;
  }
}

function evaluateExpression(expression, scopeManager) {
  const normalized = normalizeExpression(expression);
  const context = scopeManager.toObject();
  const names = Object.keys(context);
  const values = names.map((name) => context[name]);
  const fn = new Function(...names, "Math", `"use strict"; return (${normalized});`);
  return fn(...values, Math);
}

function resolveTemplate(template, scope, runtime) {
  if (!template?.trim()) return "";
  if (!template.includes("{{")) return template;
  return template.replace(/{{(.*?)}}/g, (_, expr) => {
    const value = evaluateExpressionSafe(expr, scope, runtime, "");
    return formatValue(value);
  });
}

function resolveColorValue(value, scope, runtime) {
  const trimmed = value?.trim();
  if (!trimmed) return "#000000";
  if (trimmed.startsWith("#")) return trimmed;
  const evaluated = evaluateExpressionSafe(trimmed, scope, runtime, trimmed);
  return toColorString(evaluated);
}

function toColorString(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    const channel = Math.max(0, Math.min(255, Math.round(value)));
    const hex = channel.toString(16).padStart(2, "0");
    return `#${hex}${hex}${hex}`;
  }
  return "#000000";
}

function rgbToHex(r, g, b) {
  const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));
  const rr = clamp(r).toString(16).padStart(2, "0");
  const gg = clamp(g).toString(16).padStart(2, "0");
  const bb = clamp(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

function formatValue(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function cloneValue(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }
  const copy = {};
  Object.entries(value).forEach(([key, val]) => {
    copy[key] = cloneValue(val);
  });
  return copy;
}

function parseListInput(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeExpression(expression) {
  if (!expression?.replace) return expression;
  return expression
    .replace(/\band\b/gi, "&&")
    .replace(/\bor\b/gi, "||")
    .replace(/\bnot\b/gi, "!")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null");
}

function collectFunctions(blocks, collection) {
  blocks.forEach((block) => {
    if (block.type === "function-def") {
      const name = (block.state.name || "").trim();
      if (name) {
        const params = parseListInput(block.state.params);
        collection.set(name, { params, body: block.children ?? [] });
      }
    }
    getChildCollections(block).forEach((childList) => {
      if (childList?.length) collectFunctions(childList, collection);
    });
  });
}

function getChildCollections(block) {
  const lists = [];
  if (Array.isArray(block?.children)) lists.push(block.children);
  if (block?.sections && typeof block.sections === "object") {
    Object.values(block.sections).forEach((value) => {
      if (Array.isArray(value)) lists.push(value);
    });
  }
  return lists;
}

LernProg.ScopeManager = ScopeManager;
LernProg.createRunner = createRunner;
LernProg.buildExecutionTrace = buildExecutionTrace;
LernProg.formatValue = formatValue;
LernProg.parseListInput = parseListInput;
LernProg.runtimeHelpers = {
  createControl,
  evaluateExpressionSafe,
  resolveTemplate,
  parseListInput,
  formatValue,
  resolveColorValue,
  rgbToHex,
  constants: { WHILE_LIMIT, CALL_DEPTH_LIMIT }
};
