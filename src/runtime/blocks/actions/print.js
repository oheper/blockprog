var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("print", function* handlePrint(api) {
  const rendered = api.resolveTemplate(api.block.state.message);
  api.runtime.output.push(String(rendered ?? ""));
  yield api.step(`Ausgabe: ${rendered ?? ""}`);
});
