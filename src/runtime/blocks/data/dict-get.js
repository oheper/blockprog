var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("dict-get", function* handleDictGet(api) {
  const target = api.block.state.target || "value";
  const dictName = api.block.state.dict || "dictionary";
  const key = api.evaluate(api.block.state.key, "key");
  const fallback = api.evaluate(api.block.state.fallback, null);
  const dict = api.scope.get(dictName) || {};
  const result = dict[key] !== undefined ? dict[key] : fallback;
  api.scope.set(target, result);
  yield api.step(`${target} ← ${dictName}[${api.formatValue(key)}]`);
});
