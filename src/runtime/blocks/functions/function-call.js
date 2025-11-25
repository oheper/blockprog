var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("function-call", function* handleFunctionCall(api) {
  const name = (api.block.state.name || "").trim();
  if (!name) {
    api.runtime.errors.push("Funktionsname für Aufruf fehlt.");
    yield api.step("Funktionsname fehlt");
    return;
  }
  let definition = api.context.functions.get(name);
  if (!definition && api.context.namespace?.length) {
    const scoped = `${api.context.namespace.join(".")}.${name}`;
    definition = api.context.functions.get(scoped);
  }
  if (!definition) {
    api.runtime.errors.push(`Funktion "${name}" ist unbekannt.`);
    yield api.step("Unbekannte Funktion");
    return;
  }
  if (api.context.callDepth >= api.constants.CALL_DEPTH_LIMIT) {
    api.runtime.errors.push("Funktionsaufruf abgebrochen (Stack-Limit erreicht).");
    yield api.step("Stack-Limit erreicht");
    return;
  }
  const argExprs = api.parseList(api.block.state.args);
  const args = argExprs.map((expr) => api.evaluate(expr, null));
  api.scope.pushFrame(`call ${name}`, { isolated: true });
  definition.params.forEach((param, idx) => {
    api.scope.set(param, args[idx]);
  });
  api.context.callDepth += 1;
  const fnControl = api.createChildControl();
  try {
    yield* api.executeChildren(definition.body ?? [], fnControl);
  } finally {
    api.context.callDepth -= 1;
    api.scope.popFrame();
  }
  const resultValue = fnControl.shouldReturn ? fnControl.value : undefined;
  if (api.block.state.target) {
    api.scope.set(api.block.state.target, resultValue);
  }
  yield api.step(`${name}() -> ${api.formatValue(resultValue)}`);
});
