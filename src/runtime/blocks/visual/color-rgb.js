var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("color-rgb", function* handleColorRgb(api) {
  const target = api.block.state.target || "farbe";
  const r = Number(api.evaluate(api.block.state.r, 0));
  const g = Number(api.evaluate(api.block.state.g, 0));
  const b = Number(api.evaluate(api.block.state.b, 0));
  const color = api.rgbToHex(r, g, b);
  api.scope.set(target, color);
  yield api.step(`${target} ← ${color}`);
});
