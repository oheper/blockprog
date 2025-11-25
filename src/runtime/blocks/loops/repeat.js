var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("repeat", function* handleRepeat(api) {
  const countRaw = api.evaluate(api.block.state.count, 0);
  const count = Math.max(0, Math.floor(Number(countRaw)));
  api.scope.pushFrame("repeat");
  if (count === 0) {
    yield api.step("repeat: 0 Durchläufe");
    api.scope.popFrame();
    return;
  }
  for (let index = 0; index < count; index += 1) {
    api.scope.set("_repeatIndex", index);
    yield api.step(`Durchlauf ${index + 1} / ${count}`);
    yield* api.executeChildren();
    if (api.control.shouldReturn || api.control.shouldBreak) {
      api.control.shouldBreak = false;
      break;
    }
    if (api.control.shouldContinue) {
      api.control.shouldContinue = false;
      continue;
    }
  }
  api.scope.popFrame();
});
