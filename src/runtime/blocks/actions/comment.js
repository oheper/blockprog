var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("comment", function* handleComment(api) {
  yield api.step(api.block.state.text || "Kommentar");
});
