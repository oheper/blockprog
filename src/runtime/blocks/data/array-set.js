var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

function ensureArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

register("array-set", function* handleArraySet(api) {
  const arrayName = api.block.state.array || "liste";
  const indexExpr = api.block.state.index || "0";
  const valueExpr = api.block.state.value;
  const target = (api.block.state.target || "").trim();
  const arr = ensureArray(api.scope.get(arrayName));
  const idx = Number(api.evaluate(indexExpr, 0));
  const value = api.evaluate(valueExpr, valueExpr);
  if (Number.isInteger(idx) && idx >= 0) {
    arr[idx] = value;
  }
  api.scope.set(target || arrayName, arr);
  yield api.step(`${target || arrayName}[${idx}] ← ${api.formatValue(value)}`);
});
