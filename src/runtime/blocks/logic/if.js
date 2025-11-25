var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("if", function* handleIf(api) {
  const condition = Boolean(api.evaluate(api.block.state.condition, false));
  yield api.step(condition ? "Bedingung erfüllt" : "Bedingung nicht erfüllt");
  if (!condition) return;
  api.scope.pushFrame("if");
  yield* api.executeChildren();
  api.scope.popFrame();
});
