var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("array-literal", function* handleArrayLiteral(api) {
  const target = api.block.state.target || "liste";
  const valuesRaw = api.block.state.values || "";
  const list = valuesRaw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((expr) => api.evaluate(expr, expr));
  api.scope.set(target, list);
  yield api.step(`${target} ← Liste (${list.length})`);
});
