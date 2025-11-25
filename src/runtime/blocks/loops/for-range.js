var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("for-range", function* handleForRange(api) {
  const variable = api.block.state.variable || "i";
  const start = Number(api.evaluate(api.block.state.from, 0));
  const end = Number(api.evaluate(api.block.state.to, 0));
  if (Number.isNaN(start) || Number.isNaN(end)) {
    api.runtime.errors.push("Start oder Ende konnte nicht berechnet werden.");
    yield api.step("Ungültige Grenzen");
    return;
  }
  const direction = start <= end ? 1 : -1;
  const condition = direction > 0 ? (value) => value < end : (value) => value > end;
  let iterations = 0;
  api.scope.pushFrame(`for ${variable}`);
  for (let value = start; condition(value); value += direction) {
    iterations += 1;
    api.scope.set(variable, value);
    yield api.step(`${variable} = ${value}`);
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
  if (iterations === 0) {
    yield api.step("Schleife übersprungen");
  }
  api.scope.popFrame();
});
