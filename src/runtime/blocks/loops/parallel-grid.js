var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("parallel-grid", function* handleParallelGrid(api) {
  const totalWidth = Number(api.evaluate(api.block.state.width, 0));
  const totalHeight = Number(api.evaluate(api.block.state.height, 0));
  const chunkWidth = Math.max(1, Number(api.evaluate(api.block.state.chunkWidth, 1)) || 1);
  const chunkHeight = Math.max(1, Number(api.evaluate(api.block.state.chunkHeight, 1)) || 1);
  const xVar = api.block.state.xVar || "chunkX";
  const yVar = api.block.state.yVar || "chunkY";
  for (let chunkX = 0; chunkX < totalWidth; chunkX += chunkWidth) {
    for (let chunkY = 0; chunkY < totalHeight; chunkY += chunkHeight) {
      api.scope.pushFrame("chunk");
      api.scope.set(xVar, chunkX);
      api.scope.set(yVar, chunkY);
      api.scope.set("chunkWidth", chunkWidth);
      api.scope.set("chunkHeight", chunkHeight);
      yield api.step(`Chunk (${chunkX}, ${chunkY})`);
      yield* api.executeChildren();
      api.scope.popFrame();
      if (api.control.shouldReturn) return;
      if (api.control.shouldBreak) {
        api.control.shouldBreak = false;
        return;
      }
      if (api.control.shouldContinue) {
        api.control.shouldContinue = false;
      }
    }
    if (api.control.shouldReturn) return;
    if (api.control.shouldBreak) {
      api.control.shouldBreak = false;
      return;
    }
  }
});
