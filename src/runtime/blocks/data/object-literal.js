var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("object-literal", function* handleObjectLiteral(api) {
  const target = api.block.state.target || "objekt";
  const pairsRaw = api.block.state.pairs || "";
  const obj = {};
  pairsRaw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [rawKey, ...rest] = entry.split(":");
      const key = (rawKey || "").trim();
      const valueExpr = rest.join(":").trim();
      if (!key) return;
      const value = api.evaluate(valueExpr, valueExpr || "");
      obj[key] = value;
    });
  api.scope.set(target, obj);
  yield api.step(`${target} ← Objekt`);
});
