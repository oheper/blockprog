var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("object-def", function* handleObjectDef(api) {
  const name = (api.block.state.name || "").trim() || "objekt";
  const properties = api.block.sections?.properties ?? api.block.children ?? [];
  const methods = api.block.sections?.methods ?? [];
  api.context.namespace = api.context.namespace || [];
  api.context.namespace.push(name);
  api.scope.pushFrame(name, { isolated: true });
  yield api.step(`Objekt ${api.context.namespace.join(".")}`);
  if (properties.length) {
    yield* api.executeChildren(properties);
  }
  if (methods.length) {
    yield* api.executeChildren(methods);
  }
  const frame = api.scope.frames?.[api.scope.frames.length - 1];
  const obj = {};
  if (frame?.variables) {
    frame.variables.forEach((value, key) => {
      obj[key] = value;
    });
  }
  api.scope.popFrame();
  api.scope.set(name, obj);
  api.context.namespace.pop();
  yield api.step(`Objekt ${name} gespeichert`);
});
