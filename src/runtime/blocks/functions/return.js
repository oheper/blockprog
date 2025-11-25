var LernProg = window.LernProg || (window.LernProg = {});
var register = LernProg.registerBlockHandler;

register("return", function* handleReturn(api) {
  const value = api.evaluate(api.block.state.value, null);
  yield api.step(`return ${api.formatValue(value)}`);
  api.control.shouldReturn = true;
  api.control.value = value;
});
