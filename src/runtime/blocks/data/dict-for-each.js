var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

function ensureObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

register("dict-for-each", function* handleDictForEach(api) {
  const dictName = api.block.state.dict || "dict";
  const keyVar = api.block.state.keyVar || "key";
  const valueVar = api.block.state.valueVar || "value";
  const source = ensureObject(api.scope.get(dictName));
  const entries = Object.entries(source);
  api.scope.pushFrame("dict for each");
  if (!entries.length) {
    yield api.step("Dict leer");
    api.scope.popFrame();
    return;
  }
  for (const [key, value] of entries) {
    api.scope.set(keyVar, key);
    api.scope.set(valueVar, value);
    yield api.step(`${keyVar}=${api.formatValue(key)}, ${valueVar}=${api.formatValue(value)}`);
    yield* api.executeChildren();
    if (api.control.shouldReturn) break;
  }
  api.scope.popFrame();
});
