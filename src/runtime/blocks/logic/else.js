var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("else", function* handleElse(api) {
  // Marker-Block, Ausführung übernimmt if-else Handler.
  yield api.step("else");
});
