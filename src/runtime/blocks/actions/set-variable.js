var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("set-variable", function* handleSetVariable(api) {
  const variable = api.block.state.variable || "variable";
  const value = api.evaluate(api.block.state.value, 0);
  api.scope.set(variable, value);
  yield api.step(`${variable} ← ${api.formatValue(value)}`);
});
