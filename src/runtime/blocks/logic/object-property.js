var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("object-property", function* handleObjectProperty(api) {
  const name = (api.block.state.name || "").trim() || "eigenschaft";
  const value = api.evaluate(api.block.state.value, null);
  api.scope.set(name, value);
  yield api.step(`${name} = ${api.formatValue(value)}`);
});
