var LernProg = window.LernProg || (window.LernProg = {});

function renderRegister(container, snapshot) {
  if (!container) return;
  if (!snapshot || !snapshot.length) {
    container.innerHTML = '<p class="register-empty">Keine Variablen aktiv.</p>';
    return;
  }
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  snapshot.forEach((frame) => {
    const card = document.createElement("article");
    card.className = "frame";
    if (!frame.active) card.classList.add("inactive");

    const header = document.createElement("div");
    header.className = "frame-header";
    const title = document.createElement("span");
    title.textContent = frame.label;
    const depth = document.createElement("span");
    depth.className = "frame-depth";
    depth.textContent = `Tiefe ${frame.depth}`;
    header.append(title, depth);
    card.appendChild(header);

    if (!frame.variables.length) {
      const empty = document.createElement("p");
      empty.className = "register-empty";
      empty.textContent = "Keine Variablen";
      card.appendChild(empty);
    } else {
      const list = document.createElement("ul");
      list.className = "variables";
      frame.variables.forEach(({ name, value }) => {
        const entry = document.createElement("li");
        entry.className = "variable-entry";

        const label = document.createElement("span");
        label.textContent = name;
        entry.appendChild(label);

        if (isPlainObject(value) && Object.keys(value).length <= 12) {
          const table = document.createElement("table");
          table.className = "object-view";
          Object.entries(value).forEach(([k, v]) => {
            const row = document.createElement("tr");
            const keyCell = document.createElement("td");
            keyCell.textContent = k;
            const valCell = document.createElement("td");
            valCell.textContent = (LernProg.formatValue || ((val) => val ?? ""))(v);
            row.append(keyCell, valCell);
            table.appendChild(row);
          });
          entry.appendChild(table);
        } else {
          const val = document.createElement("span");
          val.className = "value";
          const formatter = LernProg.formatValue || ((val) => val ?? "");
          val.textContent = formatter(value);
          entry.appendChild(val);
        }
        list.appendChild(entry);
      });
      card.appendChild(list);
    }
    fragment.appendChild(card);
  });
  container.appendChild(fragment);
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

LernProg.renderRegister = renderRegister;
