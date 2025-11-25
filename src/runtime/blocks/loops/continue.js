var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("continue", function* handleContinue(api) {
  api.control.shouldContinue = true;
  yield api.step("continue");
});
