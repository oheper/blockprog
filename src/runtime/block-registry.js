var LernProg = window.LernProg || (window.LernProg = {});

const handlerMap = new Map();

LernProg.registerBlockHandler = function registerBlockHandler(type, handler) {
  if (!type || typeof handler !== "function") return;
  handlerMap.set(type, handler);
};

LernProg.getBlockHandler = function getBlockHandler(type) {
  return handlerMap.get(type);
};
