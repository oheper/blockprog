var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("plot-pixel", function* handlePlotPixel(api) {
  const x = Number(api.evaluate(api.block.state.x, 0));
  const y = Number(api.evaluate(api.block.state.y, 0));
  const color = api.resolveColorValue(api.block.state.color);
  api.queueCanvasOp({ type: "pixel", x, y, color });
  yield api.step(`Pixel (${Math.round(x)}, ${Math.round(y)}) ← ${color}`);
});
