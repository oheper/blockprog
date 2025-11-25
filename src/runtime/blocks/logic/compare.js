var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("compare", function* handleCompare(api) {
  const operator = api.block.state.operator || "==";
  const expression = `(${api.block.state.left || 0}) ${operator} (${api.block.state.right || 0})`;
  const result = Boolean(api.evaluate(expression, false));
  const target = api.block.state.target || "vergleich";
  api.scope.set(target, result);
  yield api.step(`${target} ← ${result}`);
});
