var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("function-def", function* handleFunctionDef(api) {
  const name = (api.block.state.name || "").trim();
  if (!name) {
    api.runtime.errors.push("Funktionsname fehlt.");
    yield api.step("Funktionsname fehlt");
    return;
  }
  const params = api.parseList(api.block.state.params);
  const ns = api.context.namespace?.length ? `${api.context.namespace.join(".")}.${name}` : name;
  api.context.functions.set(ns, { params, body: api.block.children ?? [] });
  yield api.step(`Funktion ${ns} gespeichert`);
});
