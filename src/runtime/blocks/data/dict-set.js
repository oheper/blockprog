var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("dict-set", function* handleDictSet(api) {
  const dictName = api.block.state.dict || "dictionary";
  const key = api.evaluate(api.block.state.key, "key");
  const value = api.evaluate(api.block.state.value, null);
  const existing = api.scope.get(dictName) || {};
  const next = { ...existing, [key]: value };
  api.scope.set(dictName, next);
  yield api.step(`${dictName}[${api.formatValue(key)}] ← ${api.formatValue(value)}`);
});
