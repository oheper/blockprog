self.window = self;
self.LernProg = self.LernProg || {};
const workerContext = self.LernProg;

function safeImport(path) {
  try {
    importScripts(path);
  } catch (error) {
    console.error(`Worker konnte ${path} nicht laden`, error);
    throw error;
  }
}

safeImport("src/palette-data.js");
safeImport("src/runtime/block-registry.js");

function collectHandlerPaths() {
  if (Array.isArray(self.BLOCK_HANDLERS) && self.BLOCK_HANDLERS.length) {
    return self.BLOCK_HANDLERS;
  }
  const seen = new Set();
  const paths = [];
  (workerContext.paletteData || []).forEach((category) => {
    (category.blocks || []).forEach((block) => {
      const handlerPath = block.handler || `${block.type}.js`;
      if (seen.has(handlerPath)) return;
      seen.add(handlerPath);
      paths.push(handlerPath);
    });
  });
  return paths;
}

collectHandlerPaths().forEach((path) => safeImport(`src/runtime/blocks/${path}`));
safeImport("src/runtime.js");

const buildTrace = workerContext.buildExecutionTrace;

self.onmessage = (event) => {
  const { id, type, payload } = event.data || {};
  if (type !== "build-trace") return;
  try {
    const result = buildTrace(payload.ast || [], payload.options || {});
    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id, success: false, error: error?.message || String(error) });
  }
};
