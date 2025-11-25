var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("parameter-slider", function* handleParameterSlider(api) {
  const variable = api.block.state.variable || "parameter";
  const value = Number(api.block.state.value ?? 0);
  api.scope.set(variable, value);
  yield api.step(`${variable} ← ${value}`);
});
