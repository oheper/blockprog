var LernProg = window.LernProg || (window.LernProg = {});

function createCanvasController(canvas) {
  const ctx = canvas?.getContext("2d");
  const width = canvas?.width ?? 0;
  const height = canvas?.height ?? 0;

  function reset() {
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  function apply(operations = []) {
    if (!ctx || !operations.length) return;
    operations.forEach((op) => {
      if (op.type === "clear") {
        reset();
      } else if (op.type === "pixel") {
        drawPixel(op.x, op.y, op.color);
      } else if (op.type === "rect") {
        drawRect(op.x, op.y, op.width, op.height, op.color);
      }
    });
  }

  function drawPixel(x, y, color) {
    if (!ctx) return;
    const px = Math.max(0, Math.min(width - 1, Math.round(x)));
    const py = Math.max(0, Math.min(height - 1, Math.round(y)));
    ctx.fillStyle = color || "#000000";
    ctx.fillRect(px, py, 1, 1);
  }

  function drawRect(x, y, rectWidth, rectHeight, color) {
    if (!ctx) return;
    const px = Math.max(0, Math.round(x));
    const py = Math.max(0, Math.round(y));
    const w = Math.max(1, Math.round(rectWidth));
    const h = Math.max(1, Math.round(rectHeight));
    ctx.fillStyle = color || "#000000";
    ctx.fillRect(px, py, w, h);
  }

  return {
    reset,
    apply
  };
}

LernProg.createCanvasController = createCanvasController;
