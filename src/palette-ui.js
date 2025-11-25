var LernProg = window.LernProg || (window.LernProg = {});

function renderPalette({ container, template, onSelect }) {
  const data = LernProg.paletteData || [];
  if (!container || !template) return;
  container.innerHTML = "";

  const createButton = (block) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = block.category;
    button.title = block.hint || block.label;
    button.textContent = `${block.icon ?? ""} ${block.label}`.trim();
    button.addEventListener("click", () => onSelect?.(block.type));
    return button;
  };

  const appendBlocks = (holder, blocks = []) => {
    blocks
      .filter((block) => block && !block.hidden)
      .forEach((block) => {
        holder.appendChild(createButton(block));
      });
  };

  data.forEach((category) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".palette-title").textContent = category.title;
    fragment.querySelector(".palette-description").textContent = category.description;

    const containerEl = fragment.querySelector(".palette-blocks");
    const hasGroups = Array.isArray(category.groups) && category.groups.length > 0;

    if (hasGroups) {
      containerEl.classList.add("palette-has-groups");
      category.groups.forEach((group) => {
        const groupEl = document.createElement("article");
        groupEl.className = "palette-subgroup";
        const title = document.createElement("h4");
        title.className = "palette-subgroup-title";
        title.textContent = group.title;
        groupEl.appendChild(title);
        if (group.description) {
          const desc = document.createElement("p");
          desc.className = "palette-subgroup-description";
          desc.textContent = group.description;
          groupEl.appendChild(desc);
        }
        const blockHolder = document.createElement("div");
        blockHolder.className = "palette-blocks";
        appendBlocks(blockHolder, group.blocks);
        groupEl.appendChild(blockHolder);
        containerEl.appendChild(groupEl);
      });
    } else {
      appendBlocks(containerEl, category.blocks);
    }

    container.appendChild(fragment);
  });
}

LernProg.renderPalette = renderPalette;
