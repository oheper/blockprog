var LernProg = window.LernProg || (window.LernProg = {});
const renderPaletteFn = LernProg.renderPalette;
const WorkspaceCtor = LernProg.Workspace;
const createRunnerFn = LernProg.createRunner;
const buildExecutionTraceFn = LernProg.buildExecutionTrace;
const createCanvasControllerFn = LernProg.createCanvasController;
const generateCodeDataFn = LernProg.generateCodeData;
const renderCodePreviewFn = LernProg.renderCodePreview;
const renderRegisterFn = LernProg.renderRegister;

if (
  !renderPaletteFn ||
  !WorkspaceCtor ||
  !createRunnerFn ||
  !createCanvasControllerFn ||
  !generateCodeDataFn ||
  !renderCodePreviewFn ||
  !renderRegisterFn
) {
  throw new Error("LernProg Module unvollständig geladen.");
}

let elements = null;
let workspace = null;
let canvasController = null;

let executionState = null;
let activeBlockId = null;
let autoPlayHandle = null;
let autoStepDelay = 350;
let fastModeEnabled = false;
let workerClient = null;
let workerFailed = false;
const MAX_TRACE_STEPS = Number.isFinite(LernProg.runtimeFlags?.maxSteps)
  ? Math.max(0, Number(LernProg.runtimeFlags.maxSteps))
  : Infinity;
const FAST_BATCH_STEPS = 800;
const FAST_SLICE_MS = 12;
const FAST_PROGRESS_INTERVAL = 500;

window.addEventListener("DOMContentLoaded", () => {
  const ready = LernProg.blockHandlersReady || Promise.resolve();
  ready.then(init).catch((error) => {
    console.error(error);
    document.getElementById("runtime-status").textContent = "Block-Handler Fehler";
  });
});

function init() {
  elements = {
    paletteContainer: document.getElementById("palette-categories"),
    paletteTemplate: document.getElementById("palette-template"),
    workspaceRoot: document.getElementById("workspace"),
    codePreview: document.getElementById("code-preview"),
    resetButton: document.getElementById("reset-workspace"),
    runButton: document.getElementById("run-program"),
    stepButton: document.getElementById("step-program"),
    speedControl: document.getElementById("speed-control"),
    speedValue: document.getElementById("speed-value"),
    exportButton: document.getElementById("export-workspace"),
    importInput: document.getElementById("import-workspace"),
    runtimeStatus: document.getElementById("runtime-status"),
    runtimeOutput: document.getElementById("runtime-output"),
    registerContainer: document.getElementById("register"),
    stepDescription: document.getElementById("step-description"),
    clearCanvasButton: document.getElementById("clear-canvas"),
    visualCanvas: document.getElementById("visual-canvas"),
    fastModeToggle: document.getElementById("fast-mode-toggle")
  };
  autoStepDelay = Number(elements.speedControl?.value || 350);
  workspace = new WorkspaceCtor(elements.workspaceRoot, { onChange: () => updatePreview() });
  canvasController = createCanvasControllerFn(elements.visualCanvas);
  workspace.init();
  fastModeEnabled = Boolean(elements.fastModeToggle?.checked);
  renderPaletteFn({
    container: elements.paletteContainer,
    template: elements.paletteTemplate,
    onSelect: (type) => workspace.addBlock(type)
  });
  bindUI();
  updateSpeedLabel();
  updateFastModeUI();
  canvasController?.reset();
  updatePreview();
}

function bindUI() {
  elements.resetButton?.addEventListener("click", () => {
    workspace.init();
    updatePreview();
  });
  elements.runButton?.addEventListener("click", () => runCurrentProgram(true));
  elements.stepButton?.addEventListener("click", () => {
    if (fastModeEnabled) return;
    runCurrentProgram(false);
  });
  elements.speedControl?.addEventListener("input", () => {
    autoStepDelay = Number(elements.speedControl.value);
    updateSpeedLabel();
    if (executionState?.mode === "auto" && !executionState.finished) {
      startAutoPlay();
    }
  });
  elements.exportButton?.addEventListener("click", handleExportWorkspace);
  elements.importInput?.addEventListener("change", handleImportWorkspace);
  elements.clearCanvasButton?.addEventListener("click", () => canvasController?.reset());
  elements.fastModeToggle?.addEventListener("change", () => {
    fastModeEnabled = Boolean(elements.fastModeToggle.checked);
    updateFastModeUI();
    if (fastModeEnabled) {
      stopAutoPlay();
      executionState = null;
    }
  });
}

function updateSpeedLabel() {
  if (!elements.speedValue) return;
  elements.speedValue.textContent = `${(autoStepDelay / 1000).toFixed(2)}s`;
}

function updateFastModeUI() {
  if (!elements) return;
  if (elements.stepButton) {
    elements.stepButton.disabled = fastModeEnabled;
    elements.stepButton.title = fastModeEnabled ? "Im Schnellmodus nicht verfügbar" : "";
  }
  if (elements.fastModeToggle) {
    elements.fastModeToggle.checked = fastModeEnabled;
  }
}

function updatePreview() {
  if (!workspace || !elements) return;
  invalidateExecutionState();
  const ast = workspace.read();
  if (!ast.length) {
    elements.codePreview.textContent = "# Noch keine Blöcke platziert.";
    return;
  }
  const codeData = generateCodeDataFn(ast);
  renderCodePreviewFn(elements.codePreview, codeData);
}

function runCurrentProgram(autoPlay = true) {
  if (!workspace) return;
  if (fastModeEnabled) {
    runFastProgram();
    return;
  }
  if (!executionState || executionState.mode !== (autoPlay ? "auto" : "step") || executionState.finished) {
    if (!prepareExecution(autoPlay)) return;
  }
  if (autoPlay) {
    startAutoPlay();
  } else {
    stepForward();
  }
}

function prepareExecution(autoPlay) {
  if (!workspace || !elements) return false;
  const ast = workspace.read();
  if (!ast.length) {
    elements.runtimeStatus.textContent = "Keine Blöcke";
    elements.runtimeOutput.textContent = "# Noch keine Blöcke platziert.";
    renderRegisterFn(elements.registerContainer, []);
    elements.stepDescription.textContent = "Keine Ausführung vorbereitet.";
    executionState = null;
    return false;
  }
  stopAutoPlay();
  canvasController?.reset();
  const runner = createRunnerFn(ast, { maxSteps: MAX_TRACE_STEPS, captureSnapshots: true });
  executionState = {
    mode: autoPlay ? "auto" : "step",
    runner,
    stepIndex: -1,
    finished: false,
    truncated: false,
    lastStep: null
  };
  elements.runtimeStatus.textContent = autoPlay ? "Automatik bereit" : "Schrittbereit";
  elements.runtimeOutput.textContent = "# Trace wird während der Ausführung erzeugt…";
  elements.stepDescription.textContent = "Noch keine Schritte ausgeführt.";
  renderRegisterFn(elements.registerContainer, []);
  highlightBlock(null);
  return true;
}

function runFastProgram() {
  if (!workspace || !elements) return;
  const ast = workspace.read();
  if (!ast.length) {
    elements.runtimeStatus.textContent = "Keine Blöcke";
    elements.runtimeOutput.textContent = "# Noch keine Blöcke platziert.";
    renderRegisterFn(elements.registerContainer, []);
    elements.stepDescription.textContent = "Keine Ausführung vorbereitet.";
    executionState = null;
    return;
  }
  stopAutoPlay();
  canvasController?.reset();
  const options = { fastMode: true, captureOutputs: false, maxSteps: MAX_TRACE_STEPS };
  const worker = getWorkerClient();
  if (worker) {
    elements.runtimeStatus.textContent = "Schnellmodus (Worker) läuft…";
    elements.runtimeOutput.textContent = "# Schnellmodus: Läuft im Hintergrund…";
    executionState = { mode: "fast-worker", finished: false, lastStep: null };
    worker
      .buildTrace(ast, options)
      .then((trace) => finalizeFastRun({ trace }))
      .catch((error) => {
        console.warn("Worker-Ausführung fehlgeschlagen, nutze Fallback", error);
        workerFailed = true;
        executionState = null;
        runFastProgramFallback(ast, options);
      });
    return;
  }
  runFastProgramFallback(ast, options);
}

function runFastProgramFallback(ast, options) {
  elements.runtimeStatus.textContent = workerFailed ? "Fallback Schnellmodus…" : "Schnellmodus läuft…";
  elements.runtimeOutput.textContent = "# Schnellmodus: Berechne Ergebnis…";

  const runner = createRunnerFn(ast, options);
  executionState = { mode: "fast", runner, finished: false, lastStep: null };
  const canvasOps = [];
  let steps = 0;
  let nextProgressUpdate = FAST_PROGRESS_INTERVAL;

  const processBatch = () => {
    if (!executionState || executionState.finished) return;
    const start = performance.now();
    let iterations = 0;
    try {
      while (iterations < FAST_BATCH_STEPS && performance.now() - start < FAST_SLICE_MS) {
        const { value, done } = runner.next();
        if (done) {
          const trace = buildTraceFromContext({
            context: runner.context,
            canvasOps,
            steps,
            lastStep: executionState.lastStep
          });
          return finalizeFastRun({ trace });
        }
        steps += 1;
        executionState.lastStep = value;
        if (value?.canvasOps?.length) {
          canvasOps.push(...value.canvasOps);
        }
        if (steps >= nextProgressUpdate) {
          elements.runtimeStatus.textContent = `Schnellmodus läuft… Schritt ${steps}`;
          nextProgressUpdate += FAST_PROGRESS_INTERVAL;
        }
        iterations += 1;
      }
      requestAnimationFrame(processBatch);
    } catch (error) {
      const trace = buildTraceFromContext({
        context: runner.context,
        canvasOps,
        steps,
        lastStep: executionState.lastStep
      });
      finalizeFastRun({ trace, error });
    }
  };

  requestAnimationFrame(processBatch);
}

function updateFastModeOutput(result) {
  const fallback = {
    output: result?.output || [],
    errors: result?.errors || []
  };
  updateOutputFromStep(fallback);
  renderRegisterFn(elements.registerContainer, []);
  elements.stepDescription.textContent = fallback.errors.length ? "Fehler im Schnellmodus" : "Schnellmodus ausgeführt.";
}

function finalizeFastRun({ trace, error }) {
  const safeTrace =
    trace || {
      steps: [],
      output: [],
      errors: [],
      truncated: false,
      totalSteps: 0,
      canvasOps: [],
      lastStep: null
    };
  executionState = executionState ? { ...executionState, finished: true } : { finished: true };

  const errors = Array.isArray(safeTrace.errors) ? [...safeTrace.errors] : [];
  if (error) {
    errors.push(error.message || String(error));
  }

  if (safeTrace.canvasOps?.length) {
    canvasController?.apply(safeTrace.canvasOps);
  }

  const status = errors.length
    ? "Fehler (Schnellmodus)"
    : safeTrace.truncated
      ? "Schnellmodus (Limit erreicht)"
      : "Schnellmodus fertig";
  const stepsText = safeTrace.totalSteps ? ` – ${safeTrace.totalSteps} Schritte` : "";
  elements.runtimeStatus.textContent = `${status}${stepsText}`;

  const fallbackStep =
    safeTrace.lastStep || safeTrace.steps?.[safeTrace.steps.length - 1] || {
      output: safeTrace.output || [],
      errors,
      snapshot: [],
      canvasOps: [],
      description: status
    };
  const mergedStep = {
    ...fallbackStep,
    errors: fallbackStep.errors?.length ? fallbackStep.errors : errors
  };
  updateOutputFromStep(mergedStep);
  renderRegisterFn(elements.registerContainer, mergedStep.snapshot || []);
  elements.stepDescription.textContent = mergedStep.description || status;
  highlightBlock(null);
  executionState = null;
}

function buildTraceFromContext({ context, canvasOps = [], steps = 0, lastStep = null }) {
  const runtimeErrors = Array.isArray(context?.runtime?.errors) ? [...context.runtime.errors] : [];
  const bufferedOps = canvasOps.length ? canvasOps : context?.canvasBuffer || [];
  const totalSteps = steps || context?.counters?.steps || 0;
  return {
    steps: [],
    output: context?.runtime?.output || [],
    errors: runtimeErrors,
    truncated: context?.truncated,
    totalSteps,
    canvasOps: bufferedOps,
    lastStep
  };
}

function getWorkerClient() {
  if (workerFailed) return null;
  if (workerClient) return workerClient;
  if (typeof Worker === "undefined") {
    workerFailed = true;
    return null;
  }
  try {
    workerClient = createWorkerClient();
    return workerClient;
  } catch (error) {
    console.warn("Konnte Worker nicht initialisieren", error);
    workerFailed = true;
    return null;
  }
}

function createWorkerClient() {
  const worker = new Worker("worker.js");
  const pending = new Map();
  let counter = 0;

  worker.onmessage = (event) => {
    const message = event.data || {};
    const entry = message.id ? pending.get(message.id) : null;
    if (!entry) return;
    pending.delete(message.id);
    if (message.success) {
      entry.resolve(message.result);
    } else {
      entry.reject(new Error(message.error || "Workerfehler"));
    }
  };

  worker.onerror = (event) => {
    const error = new Error(event?.message || "Workerfehler");
    pending.forEach(({ reject }) => reject(error));
    pending.clear();
  };

  function send(type, payload) {
    return new Promise((resolve, reject) => {
      const id = `req-${++counter}`;
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, type, payload });
    });
  }

  return {
    buildTrace(ast, options) {
      return send("build-trace", { ast, options });
    }
  };
}

function startAutoPlay() {
  if (!executionState?.runner) return;
  stopAutoPlay();
  elements.runtimeStatus.textContent = "Automatik läuft…";
  const playNext = () => {
    if (!executionState || executionState.finished) return;
    const advanced = advanceRunner();
    if (!advanced) return;
    autoPlayHandle = setTimeout(playNext, autoStepDelay);
  };
  playNext();
}

function stepForward() {
  stopAutoPlay();
  if (!executionState) {
    if (!prepareExecution(false)) return;
  }
  advanceRunner();
}

function applyStep(step) {
  highlightBlock(step.blockId);
  renderRegisterFn(elements.registerContainer, step.snapshot);
  updateOutputFromStep(step);
  canvasController?.apply(step.canvasOps);
  elements.stepDescription.textContent = step.description;
  elements.runtimeStatus.textContent = `Schritt ${executionState.stepIndex + 1}`;
}

function finishExecution() {
  stopAutoPlay();
  if (!executionState) return;
  executionState.finished = true;
  const lastStep = executionState.lastStep;
  const ctx = executionState.runner?.context;
  const hasErrors = Boolean(lastStep?.errors?.length || ctx?.runtime?.errors?.length);
  const truncated = Boolean(ctx?.truncated);
  executionState.truncated = truncated;
  elements.runtimeStatus.textContent = hasErrors ? "Fehler" : truncated ? "Fertig (Limit)" : "Fertig";
  if (ctx && (!lastStep || ctx.runtime.errors.length)) {
    const fallback = lastStep || {
      output: ctx.runtime.output || [],
      errors: ctx.runtime.errors || [],
      snapshot: ctx.scope?.snapshot ? ctx.scope.snapshot() : [],
      canvasOps: [],
      description: truncated ? "Limit erreicht" : "Fertig"
    };
    updateOutputFromStep(fallback);
    renderRegisterFn(elements.registerContainer, fallback.snapshot || []);
  }
  highlightBlock(null);
}

function advanceRunner() {
  if (!executionState?.runner) return false;
  let value;
  let done = false;
  try {
    const result = executionState.runner.next();
    value = result.value;
    done = result.done;
  } catch (error) {
    handleRunnerFailure(error);
    return false;
  }
  if (done) {
    finishExecution();
    return false;
  }
  executionState.stepIndex += 1;
  executionState.lastStep = value;
  applyStep(value);
  return true;
}

function handleRunnerFailure(error) {
  stopAutoPlay();
  if (!executionState?.runner) return;
  const ctx = executionState.runner.context;
  const message = error?.message || String(error);
  ctx.runtime.errors.push(message);
  const fallback = {
    output: ctx.runtime.output || [],
    errors: ctx.runtime.errors || [message],
    snapshot: ctx.scope?.snapshot ? ctx.scope.snapshot() : [],
    canvasOps: [],
    description: "Fehler"
  };
  executionState.lastStep = fallback;
  executionState.finished = true;
  elements.runtimeStatus.textContent = "Fehler";
  updateOutputFromStep(fallback);
  renderRegisterFn(elements.registerContainer, fallback.snapshot || []);
  highlightBlock(null);
}

function updateOutputFromStep(step) {
  const lines = [];
  const output = step.output || [];
  if (output.length) {
    lines.push(output.join("\n"));
  } else {
    lines.push("# Kein Output erzeugt.");
  }
  const errors = Array.isArray(step.errors) ? Array.from(new Set(step.errors)) : [];
  if (errors.length) {
    lines.push(`⚠️ Fehler:\n${errors.join("\n")}`);
  }
  elements.runtimeOutput.textContent = lines.join("\n\n");
}

function stopAutoPlay() {
  if (autoPlayHandle) {
    clearTimeout(autoPlayHandle);
    autoPlayHandle = null;
  }
}

function invalidateExecutionState() {
  stopAutoPlay();
  executionState = null;
  highlightBlock(null);
  elements.stepDescription.textContent = "Noch keine Schritte ausgeführt.";
  renderRegisterFn(elements.registerContainer, []);
  canvasController?.reset();
}

function handleExportWorkspace() {
  if (!workspace) return;
  const snapshot = workspace.serialize();
  const data = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `lernprog-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function handleImportWorkspace(event) {
  if (!workspace || !elements) return;
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (workspace.load(data)) {
        elements.runtimeStatus.textContent = "Importiert";
        elements.runtimeOutput.textContent = "# Workspace erfolgreich geladen.";
      } else {
        elements.runtimeStatus.textContent = "Importfehler";
        elements.runtimeOutput.textContent = "# JSON ohne Blockdaten.";
      }
    } catch (error) {
      elements.runtimeStatus.textContent = "Importfehler";
      elements.runtimeOutput.textContent = `# Konnte Datei nicht laden: ${error.message}`;
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function highlightBlock(blockId) {
  if (activeBlockId) {
    document.querySelector(`[data-block-id="${activeBlockId}"]`)?.classList.remove("active");
    document.querySelectorAll(`[data-code-block-id="${activeBlockId}"]`).forEach((el) => {
      el.classList.remove("active");
    });
  }
  activeBlockId = blockId || null;
  if (blockId) {
    document.querySelector(`[data-block-id="${blockId}"]`)?.classList.add("active");
    document.querySelectorAll(`[data-code-block-id="${blockId}"]`).forEach((el) => {
      el.classList.add("active");
    });
  }
}
