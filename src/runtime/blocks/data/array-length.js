var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

register("array-length", function* handleArrayLength(api) {
  const arrayName = api.block.state.array || "liste";
  const target = api.block.state.target || "len";
  const arr = ensureArray(api.scope.get(arrayName));
  api.scope.set(target, arr.length);
  yield api.step(`${target} ← len(${arrayName})`);
});
