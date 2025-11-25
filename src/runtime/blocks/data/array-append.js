var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

function ensureArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

register("array-append", function* handleArrayAppend(api) {
  const arrayName = api.block.state.array || "liste";
  const valueExpr = api.block.state.value;
  const target = (api.block.state.target || "").trim();
  const base = ensureArray(api.scope.get(arrayName));
  const value = api.evaluate(valueExpr, valueExpr);
  const next = [...base, value];
  api.scope.set(target || arrayName, next);
  yield api.step(`${target || arrayName} + ${api.formatValue(value)}`);
});
