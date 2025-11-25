var LernProg = window.LernProg || (window.LernProg = {});

function generateCodeData(blocks, depth = 0) {
  const parts = [];
  const nodes = [];
  blocks.forEach((block, index) => {
    const result = renderBlockWithElements(block, depth);
    if (!result.code) return;
    parts.push(result.code);
    if (index < blocks.length - 1) {
      parts.push("\n");
    }
    nodes.push(result.element);
  });
  return { text: parts.join(""), nodes };
}

function renderCodePreview(target, data) {
  if (!target) return;
  if (!data?.nodes?.length) {
    target.textContent = (data?.text || "# Noch keine Blöcke platziert.").trimEnd();
    return;
  }
  target.innerHTML = "";
  const fragment = document.createDocumentFragment();
  data.nodes.forEach((node, index) => {
    fragment.appendChild(node);
    if (index < data.nodes.length - 1) {
      fragment.appendChild(document.createTextNode("\n"));
    }
  });
  target.appendChild(fragment);
}

function renderBlock(block, depth) {
  return renderBlockWithElements(block, depth).code;
}

function renderBlockWithElements(block, depth) {
  const indent = "  ".repeat(depth);
  const element = document.createElement("span");
  element.className = `code-segment ${block.category || "default"}`;
  element.dataset.codeBlockId = block.id;
  let code;
  switch (block.type) {
    case "print":
      code = `${indent}${renderPrint(block.state.message)}`;
      element.textContent = code;
      break;
    case "set-variable": {
      const name = block.state.variable || "variable";
      const value = block.state.value || "0";
      code = `${indent}${name} = ${value}`;
      element.textContent = code;
      break;
    }
    case "comment":
      code = `${indent}# ${block.state.text || "Kommentar"}`;
      element.textContent = code;
      break;
    case "if": {
      const condition = block.state.condition || "bedingung";
      const header = `${indent}if ${condition}:\n`;
      element.append(document.createTextNode(header));
      const body = renderChildSequence(block.children, depth + 1, element);
      code = `${header}${body}`;
      break;
    }
    case "if-else": {
      const condition = block.state.condition || "bedingung";
      const header = `${indent}if ${condition}:\n`;
      element.append(document.createTextNode(header));
      const thenChildren = block.sections?.then || block.sections?.wahr || extractThenChildren(block.children);
      const elseChildren =
        block.sections?.otherwise || block.sections?.else || block.sections?.sonst || extractElseChildren(block.children);
      const thenCode = renderChildSequence(thenChildren, depth + 1, element);
      let elseCode = "";
      if (elseChildren.length) {
        const elseHeader = `${indent}else:\n`;
        element.append(document.createTextNode(`\n${elseHeader}`));
        elseCode = `\n${elseHeader}${renderChildSequence(elseChildren, depth + 1, element)}`;
      }
      code = `${header}${thenCode}${elseCode}`;
      break;
    }
    case "repeat": {
      const count = block.state.count || "3";
      const header = `${indent}for _ in range(${count}):\n`;
      element.append(document.createTextNode(header));
      const body = renderChildSequence(block.children, depth + 1, element);
      code = `${header}${body}`;
      break;
    }
    case "for-range": {
      const variable = block.state.variable || "i";
      const from = block.state.from || "0";
      const to = block.state.to || "0";
      const header = `${indent}for ${variable} in range(${from}, ${to}):\n`;
      element.append(document.createTextNode(header));
      const body = renderChildSequence(block.children, depth + 1, element);
      code = `${header}${body}`;
      break;
    }
    case "while": {
      const condition = block.state.condition || "true";
      const header = `${indent}while ${condition}:\n`;
      element.append(document.createTextNode(header));
      const body = renderChildSequence(block.children, depth + 1, element);
      code = `${header}${body}`;
      break;
    }
    case "function-def": {
      const name = block.state.name || "funktion";
      const params = (LernProg.parseListInput || (() => []))(block.state.params).join(", ");
      const header = `${indent}def ${name}(${params}):\n`;
      element.append(document.createTextNode(header));
      const body = renderChildSequence(block.children, depth + 1, element);
      code = `${header}${body}`;
      break;
    }
    case "object-def": {
      const name = block.state.name || "objekt";
      const properties = block.sections?.properties || [];
      const methods = block.sections?.methods || [];
      const header = `${indent}${name} = {\n`;
      element.append(document.createTextNode(header));
      const propsCode = renderChildSequence(properties, depth + 1, element, { showPlaceholder: false });
      let methodCode = "";
      if (methods.length) {
        const methodHeader = `${indent}  # Methoden\n`;
        element.append(document.createTextNode(`\n${methodHeader}`));
        methodCode = `\n${methodHeader}${renderChildSequence(methods, depth + 2, element, { showPlaceholder: false })}`;
      }
      const footer = `\n${indent}}`;
      element.append(document.createTextNode(footer));
      code = `${header}${propsCode}${methodCode}${footer}`;
      break;
    }
    case "object-property": {
      const name = block.state.name || "eigenschaft";
      const value = block.state.value || "0";
      code = `${indent}${name}: ${value}`;
      element.textContent = code;
      break;
    }
    case "function-call": {
      const name = block.state.name || "funktion";
      const args = (LernProg.parseListInput || (() => []))(block.state.args).join(", ");
      if (block.state.target) {
        code = `${indent}${block.state.target} = ${name}(${args})`;
      } else {
        code = `${indent}${name}(${args})`;
      }
      element.textContent = code;
      break;
    }
    case "return": {
      const value = block.state.value || "";
      code = `${indent}return ${value || ""}`.trimEnd() || `${indent}return`;
      element.textContent = code;
      break;
    }
    case "clear-canvas": {
      code = `${indent}canvas.clear()`;
      element.textContent = code;
      break;
    }
    case "plot-pixel": {
      const x = block.state.x || 0;
      const y = block.state.y || 0;
      const colorLiteral = formatColorCode(block.state.color);
      code = `${indent}canvas.set_pixel(${x}, ${y}, ${colorLiteral})`;
      element.textContent = code;
      break;
    }
    case "dict-set": {
      const dict = block.state.dict || "grid";
      const key = block.state.key || "key";
      const value = block.state.value || "true";
      code = `${indent}${dict} = { ...( ${dict} || {} ), [${key}]: ${value} }`;
      element.textContent = code;
      break;
    }
    case "dict-get": {
      const target = block.state.target || "value";
      const dict = block.state.dict || "grid";
      const key = block.state.key || "key";
      const fallback = block.state.fallback || "false";
      code = `${indent}${target} = (${dict} && ${dict}[${key}] !== undefined ? ${dict}[${key}] : ${fallback})`;
      element.textContent = code;
      break;
    }
    default:
      code = `${indent}// ${block.type}`;
      element.textContent = code;
  }
  return { code, element };
}

function renderChildSequence(children, depth, parentElement, options = {}) {
  const showPlaceholder = options.showPlaceholder !== false;
  if (!children?.length) {
    const placeholder = `${"  ".repeat(depth)}pass`;
    if (showPlaceholder) {
      parentElement.append(document.createTextNode(placeholder));
      return placeholder;
    }
    return "";
  }
  const codes = [];
  children.forEach((child, idx) => {
    const result = renderBlockWithElements(child, depth);
    codes.push(result.code);
    parentElement.appendChild(result.element);
    if (idx < children.length - 1) {
      parentElement.appendChild(document.createTextNode("\n"));
    }
  });
  return codes.join("\n");
}

function extractThenChildren(children = []) {
  if (!Array.isArray(children)) return [];
  const elseIndex = children.findIndex((child) => child.type === "else");
  return elseIndex >= 0 ? children.slice(0, elseIndex) : children;
}

function extractElseChildren(children = []) {
  if (!Array.isArray(children)) return [];
  const elseIndex = children.findIndex((child) => child.type === "else");
  return elseIndex >= 0 ? children.slice(elseIndex + 1) : [];
}

function renderPrint(message) {
  const trimmed = message?.trim();
  if (!trimmed) return 'print("Text")';
  const expressionOnly = trimmed.match(/^{{\s*(.*?)\s*}}$/);
  if (expressionOnly) {
    return `print(${expressionOnly[1]})`;
  }
  if (trimmed.includes("{{")) {
    const converted = trimmed.replace(/{{\s*(.*?)\s*}}/g, (_, expr) => `{${expr.trim()}}`);
    return `print(f"${escapeForPython(converted)}")`;
  }
  return `print("${escapeForPython(trimmed)}")`;
}

function escapeForPython(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatColorCode(value) {
  const trimmed = value?.trim();
  if (!trimmed) return '"#000000"';
  if (trimmed.startsWith("#")) {
    return `"${escapeForPython(trimmed)}"`;
  }
  return trimmed;
}

LernProg.generateCodeData = generateCodeData;
LernProg.renderCodePreview = renderCodePreview;
LernProg.renderBlock = renderBlock;
