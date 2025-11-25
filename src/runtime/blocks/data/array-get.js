var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

register("array-get", function* handleArrayGet(api) {
  const arrayName = api.block.state.array || "liste";
  const indexExpr = api.block.state.index || "0";
  const target = api.block.state.target || "wert";
  const fallbackExpr = api.block.state.fallback;
  const arr = ensureArray(api.scope.get(arrayName));
  const idx = Number(api.evaluate(indexExpr, 0));
  const fallback = api.evaluate(fallbackExpr, fallbackExpr);
  const value = Number.isInteger(idx) && idx >= 0 && idx < arr.length ? arr[idx] : fallback;
  api.scope.set(target, value);
  yield api.step(`${target} ← ${arrayName}[${idx}]`);
});
