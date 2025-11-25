var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("clear-canvas", function* handleClearCanvas(api) {
  api.queueCanvasOp({ type: "clear" });
  yield api.step("Canvas leeren");
});
