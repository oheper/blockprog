var LernProg = window.LernProg || (window.LernProg = {});

function loadScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = path;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Konnte Block-Handler ${path} nicht laden.`));
    document.head.appendChild(script);
  });
}

const handlerPromises = [];
const seen = new Set();

(LernProg.paletteData || []).forEach((category) => {
  category.blocks.forEach((block) => {
    const handlerPath = block.handler || `${block.type}.js`;
    if (seen.has(handlerPath)) return;
    seen.add(handlerPath);
    handlerPromises.push(loadScript(`src/runtime/blocks/${handlerPath}`));
  });
});

LernProg.blockHandlersReady = Promise.all(handlerPromises);
