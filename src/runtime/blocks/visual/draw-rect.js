var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("draw-rect", function* handleDrawRect(api) {
  const x = Number(api.evaluate(api.block.state.x, 0));
  const y = Number(api.evaluate(api.block.state.y, 0));
  const width = Number(api.evaluate(api.block.state.width, 1));
  const height = Number(api.evaluate(api.block.state.height, 1));
  const color = api.resolveColorValue(api.block.state.color);
  api.queueCanvasOp({ type: "rect", x, y, width, height, color });
  yield api.step(`Rechteck (${x},${y}) ${width}x${height}`);
});
