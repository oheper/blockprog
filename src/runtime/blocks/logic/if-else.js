var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("if-else", function* handleIfElse(api) {
  const condition = Boolean(api.evaluate(api.block.state.condition, false));
  let thenChildren = [];
  let elseChildren = [];
  if (api.block.sections) {
    thenChildren = api.block.sections.then || api.block.sections.wahr || [];
    elseChildren = api.block.sections.otherwise || api.block.sections.sonst || [];
  } else {
    const children = api.block.children || [];
    const elseIndex = children.findIndex((child) => child.type === "else");
    thenChildren = elseIndex >= 0 ? children.slice(0, elseIndex) : children;
    elseChildren = elseIndex >= 0 ? children.slice(elseIndex + 1) : [];
  }
  yield api.step(condition ? "Bedingung erfüllt" : "Bedingung nicht erfüllt");
  if (condition) {
    api.scope.pushFrame("if");
    yield* api.executeChildren(thenChildren);
    api.scope.popFrame();
  } else if (elseChildren.length) {
    api.scope.pushFrame("else");
    yield* api.executeChildren(elseChildren);
    api.scope.popFrame();
  }
});
