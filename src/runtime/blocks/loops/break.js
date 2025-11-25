var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("break", function* handleBreak(api) {
  api.control.shouldBreak = true;
  yield api.step("break");
});
