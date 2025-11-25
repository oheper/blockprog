var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("logic-combine", function* handleLogicCombine(api) {
  const operator = api.block.state.operator || "&&";
  const expression = `(${api.block.state.left || false}) ${operator} (${api.block.state.right || false})`;
  const result = Boolean(api.evaluate(expression, false));
  const target = api.block.state.target || "logic";
  api.scope.set(target, result);
  yield api.step(`${target} ← ${result}`);
});
