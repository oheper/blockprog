var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("while", function* handleWhile(api) {
  api.scope.pushFrame("while");
  let iterations = 0;
  const limit = api.constants.WHILE_LIMIT;
  while (api.evaluate(api.block.state.condition, false)) {
    iterations += 1;
    if (iterations > limit) {
      api.runtime.errors.push(`While-Schleife überschritt das Limit von ${limit} Wiederholungen.`);
      yield api.step("Abgebrochen (Limit erreicht)");
      break;
    }
    yield api.step(`Iteration ${iterations}`);
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
    yield api.step("Bedingung sofort falsch");
  }
  api.scope.popFrame();
});
