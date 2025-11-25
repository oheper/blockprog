var LernProg = window.LernProg || (window.LernProg = {});

function resolveDefinition(type) {
  const getter = LernProg.getBlockDefinition || (() => null);
  return getter(type);
}

class Workspace {
  constructor(root, { onChange } = {}) {
    this.root = root;
    this.onChange = onChange;
    this.stack = null;
    this.blockCounter = 0;
  }

  init() {
    if (!this.root) return;
    this.root.innerHTML = "";
    this.stack = this.createStack();
    this.root.appendChild(this.stack);
  }

  setChangeHandler(handler) {
    this.onChange = handler;
  }

  addBlock(type, stack = this.stack) {
    if (!stack) return;
    const definition = resolveDefinition(type);
    if (!definition) return;
    const block = this.createBlockElement(definition);
    this.insertBlockElement(block, stack);
    this.notifyChange();
  }

  serialize() {
    return {
      version: 1,
      blocks: this.read()
    };
  }

  read() {
    return this.readStack(this.stack);
  }

  load(snapshot) {
    if (!snapshot?.blocks) return false;
    this.init();
    snapshot.blocks.forEach((blockData) => this.insertBlockFromSnapshot(blockData, this.stack));
    this.notifyChange();
    return true;
  }

  notifyChange() {
    if (typeof this.onChange === "function") {
      this.onChange();
    }
  }

  createStack() {
    const stack = document.createElement("div");
    stack.className = "block-stack";
    stack.appendChild(this.createDropZone());
    return stack;
  }

  createDropZone() {
    const zone = document.createElement("div");
    zone.className = "drop-zone";
    zone.addEventListener("dragover", (event) => this.handleDragOver(event));
    zone.addEventListener("dragleave", (event) => this.handleDragLeave(event));
    zone.addEventListener("drop", (event) => this.handleDrop(event));
    return zone;
  }

  handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("active");
  }

  handleDragLeave(event) {
    event.currentTarget.classList.remove("active");
  }

  handleDrop(event) {
    event.preventDefault();
    const zone = event.currentTarget;
    zone.classList.remove("active");
    const blockId = event.dataTransfer.getData("text/plain");
    const block = document.querySelector(`[data-block-id="${blockId}"]`);
    if (!block || block.contains(zone)) return;
    const trailingZone = this.ensureTrailingZone(block);
    if (zone === trailingZone) return;
    zone.after(block);
    block.after(trailingZone);
    this.notifyChange();
  }

  ensureTrailingZone(block) {
    let zone = block.nextElementSibling;
    if (!zone || !zone.classList.contains("drop-zone")) {
      zone = this.createDropZone();
      block.after(zone);
    }
    return zone;
  }

  nextBlockId() {
    this.blockCounter += 1;
    return `block-${this.blockCounter}`;
  }

  createBlockElement(definition) {
    const block = document.createElement("div");
    block.className = "block";
    block.dataset.type = definition.type;
    block.dataset.category = definition.category;
    block.dataset.blockId = this.nextBlockId();
    block.draggable = true;

    block.addEventListener("dragstart", (event) => {
      block.classList.add("dragging");
      event.dataTransfer.setData("text/plain", block.dataset.blockId);
      event.dataTransfer.effectAllowed = "move";
    });

    block.addEventListener("dragend", () => {
      block.classList.remove("dragging");
    });

    const header = document.createElement("div");
    header.className = "block-header";
    const name = document.createElement("span");
    name.textContent = `${definition.icon ?? ""} ${definition.label}`.trim();
    header.appendChild(name);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "block-remove";
    removeButton.setAttribute("aria-label", `${definition.label} löschen`);
    removeButton.innerHTML = "&times;";
    removeButton.addEventListener("click", () => this.deleteBlock(block));
    header.appendChild(removeButton);
    block.appendChild(header);

    if (definition.fields?.length) {
      const body = document.createElement("div");
      body.className = "block-body";
      definition.fields.forEach((field) => {
        const input = this.createField(field);
        body.appendChild(input);
      });
      block.appendChild(body);
    }

    if (Array.isArray(definition.childrenSections) && definition.childrenSections.length) {
      const all = document.createElement("div");
      all.className = "block-children multi-children";
      definition.childrenSections.forEach((section) => {
        const container = document.createElement("div");
        container.className = "children-section";
        const label = document.createElement("p");
        label.className = "children-label";
        label.textContent = section.label ?? "Bereich";
        container.appendChild(label);
        const childStack = this.createStack();
        childStack.dataset.childName = section.name;
        container.appendChild(childStack);
        all.appendChild(container);
      });
      block.appendChild(all);
    } else if (definition.hasChildren) {
      const container = document.createElement("div");
      container.className = "block-children";
      const label = document.createElement("p");
      label.className = "children-label";
      label.textContent = definition.childrenLabel ?? "Block";
      container.appendChild(label);
      const childStack = this.createStack();
      container.appendChild(childStack);
      block.appendChild(container);
    }

    return block;
  }

  applyStateToBlock(block, state) {
    if (!state) return;
    block.querySelectorAll("[data-field]").forEach((input) => {
      const key = input.dataset.field;
      if (state[key] !== undefined) {
        input.value = state[key];
        if (input.type === "range") {
          const display = input.nextSibling;
          if (display) display.textContent = state[key];
        }
      }
    });
  }

  createField(field) {
    const wrapper = document.createElement("label");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.fontSize = "0.75rem";
    wrapper.style.fontWeight = "600";
    wrapper.style.gap = "0.15rem";
    wrapper.textContent = field.label;

    if (field.type === "slider") {
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = field.min ?? 0;
      slider.max = field.max ?? 100;
      slider.step = field.step ?? 1;
      slider.value = field.defaultValue ?? slider.min;
      slider.dataset.field = field.name;
      const display = document.createElement("span");
      display.className = "slider-value";
      display.textContent = slider.value;
      slider.addEventListener("input", () => {
        display.textContent = slider.value;
        this.notifyChange();
      });
      wrapper.appendChild(slider);
      wrapper.appendChild(display);
    } else {
      const control = field.multiline ? document.createElement("textarea") : document.createElement("input");
      if (!field.multiline) {
        control.type = "text";
      }
      control.placeholder = field.placeholder || "";
      if (field.defaultValue !== undefined) control.value = field.defaultValue;
      control.dataset.field = field.name;
      control.addEventListener("input", () => this.notifyChange());
      wrapper.appendChild(control);
    }
    return wrapper;
  }

  deleteBlock(block) {
    const trailingZone = block.nextElementSibling;
    if (trailingZone?.classList.contains("drop-zone")) {
      trailingZone.remove();
    }
    block.remove();
    this.notifyChange();
  }

  insertBlockElement(block, stack) {
    const newZone = this.createDropZone();
    const zones = [...stack.children].reverse();
    const targetZone = zones.find((node) => node.classList?.contains("drop-zone"));
    if (targetZone) {
      targetZone.after(block);
      block.after(newZone);
    } else {
      stack.appendChild(block);
      block.after(newZone);
    }
  }

  readStack(stack) {
    if (!stack) return [];
    const blocks = [];
    Array.from(stack.children).forEach((child) => {
      if (child.classList?.contains("block")) {
        blocks.push(this.readBlock(child));
      }
    });
    return blocks;
  }

  readBlock(blockEl) {
    const type = blockEl.dataset.type;
    const id = blockEl.dataset.blockId;
    const category = blockEl.dataset.category;
    const definition = resolveDefinition(type);
    const state = {};
    blockEl.querySelectorAll("[data-field]").forEach((input) => {
      if (input.closest(".block") === blockEl) {
        state[input.dataset.field] = input.value.trim();
      }
    });
    const children = [];
    let sections = null;
    if (definition?.childrenSections?.length) {
      sections = {};
      definition.childrenSections.forEach((section) => {
        const stack = blockEl.querySelector(`.block-children [data-child-name="${section.name}"]`);
        sections[section.name] = stack ? this.readStack(stack) : [];
      });
      const firstName = definition.childrenSections[0]?.name;
      if (firstName && sections[firstName]) {
        children.push(...sections[firstName]);
      }
    } else {
      const childStack = blockEl.querySelector(".block-children .block-stack");
      if (childStack) children.push(...this.readStack(childStack));
    }
    return { id, type, category, state, children, sections };
  }

  insertBlockFromSnapshot(data, stack) {
    const definition = resolveDefinition(data.type);
    if (!definition || !stack) return;
    const block = this.createBlockElement(definition);
    this.applyStateToBlock(block, data.state);
    this.insertBlockElement(block, stack);
    if (definition?.childrenSections?.length) {
      const legacySplit =
        !data.sections && Array.isArray(data.children) ? this.splitLegacyElseChildren(data.children) : null;
      definition.childrenSections.forEach((section) => {
        const stackEl = block.querySelector(`.block-children [data-child-name="${section.name}"]`);
        const items =
          (data.sections && Array.isArray(data.sections[section.name]) && data.sections[section.name]) ||
          (legacySplit ? legacySplit[section.name] : null) ||
          (section === definition.childrenSections[0] ? data.children || [] : []);
        if (!stackEl) return;
        items.forEach((child) => this.insertBlockFromSnapshot(child, stackEl));
      });
    } else if (definition.hasChildren && data.children?.length) {
      const childStack = block.querySelector(".block-children .block-stack");
      data.children.forEach((child) => this.insertBlockFromSnapshot(child, childStack));
    }
  }

  splitLegacyElseChildren(children) {
    const elseIndex = children.findIndex((child) => child?.type === "else");
    const thenChildren = elseIndex >= 0 ? children.slice(0, elseIndex) : children;
    const elseChildren = elseIndex >= 0 ? children.slice(elseIndex + 1) : [];
    return { then: thenChildren, otherwise: elseChildren };
  }
}

LernProg.Workspace = Workspace;
