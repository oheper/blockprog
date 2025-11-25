var LernProg = window.LernProg || (window.LernProg = {});

const dataBlocks = (() => {
  const dictSet = {
    type: "dict-set",
    handler: "data/dict-set.js",
    label: "Map-Wert setzen",
    category: "action",
    icon: "🧱",
    hint: "Schreibt value unter key in ein Dictionary/Objekt.",
    fields: [
      { name: "dict", label: "Dictionary", placeholder: "grid" },
      { name: "key", label: "Schlüssel", placeholder: "key" },
      { name: "value", label: "Wert", placeholder: "true" }
    ]
  };

  const dictGet = {
    type: "dict-get",
    handler: "data/dict-get.js",
    label: "Map-Wert lesen",
    category: "action",
    icon: "📥",
    hint: "Liest key aus Dictionary/Objekt (mit Fallback).",
    fields: [
      { name: "target", label: "Speichern in", placeholder: "value" },
      { name: "dict", label: "Dictionary", placeholder: "grid" },
      { name: "key", label: "Schlüssel", placeholder: "key" },
      { name: "fallback", label: "Standard", placeholder: "false" }
    ]
  };

  const dictForEach = {
    type: "dict-for-each",
    handler: "data/dict-for-each.js",
    label: "Map durchlaufen",
    category: "data",
    icon: "📜",
    hint: "Iteriert über alle Schlüssel/Werte.",
    fields: [
      { name: "dict", label: "Dictionary", placeholder: "grid" },
      { name: "keyVar", label: "Key-Variable", placeholder: "k" },
      { name: "valueVar", label: "Value-Variable", placeholder: "v" }
    ],
    hasChildren: true,
    childrenLabel: "Körper"
  };

  const objectLiteral = {
    type: "object-literal",
    handler: "data/object-literal.js",
    label: "Map/Objekt bauen",
    category: "data",
    icon: "🧱",
    hint: "Erstellt ein Objekt/Dictionary aus k:v-Paaren.",
    fields: [
      { name: "target", label: "Speichern in", placeholder: "objekt" },
      { name: "pairs", label: "Paare (k:v)", placeholder: "re:0, im:0" }
    ]
  };

  const arrayLiteral = {
    type: "array-literal",
    handler: "data/array-literal.js",
    label: "Liste bauen",
    category: "data",
    icon: "📚",
    hint: "Erstellt eine Liste aus Werten.",
    fields: [
      { name: "target", label: "Speichern in", placeholder: "liste" },
      { name: "values", label: "Werte (kommagetrennt)", placeholder: "1, 2, 3" }
    ]
  };

  const arrayAppend = {
    type: "array-append",
    handler: "data/array-append.js",
    label: "Liste anhängen",
    category: "data",
    icon: "➕",
    fields: [
      { name: "array", label: "Liste", placeholder: "liste" },
      { name: "value", label: "Wert", placeholder: "x" },
      { name: "target", label: "Speichern in (optional)", placeholder: "listeNeu" }
    ]
  };

  const arrayGet = {
    type: "array-get",
    handler: "data/array-get.js",
    label: "Listen-Element lesen",
    category: "data",
    icon: "📖",
    fields: [
      { name: "array", label: "Liste", placeholder: "liste" },
      { name: "index", label: "Index", placeholder: "0" },
      { name: "target", label: "Speichern in", placeholder: "wert" },
      { name: "fallback", label: "Fallback", placeholder: "null" }
    ]
  };

  const arraySet = {
    type: "array-set",
    handler: "data/array-set.js",
    label: "Listen-Element setzen",
    category: "data",
    icon: "🛠️",
    fields: [
      { name: "array", label: "Liste", placeholder: "liste" },
      { name: "index", label: "Index", placeholder: "0" },
      { name: "value", label: "Wert", placeholder: "x" },
      { name: "target", label: "Speichern in (optional)", placeholder: "listeNeu" }
    ]
  };

  const arrayLength = {
    type: "array-length",
    handler: "data/array-length.js",
    label: "Listen-Länge",
    category: "data",
    icon: "📏",
    fields: [
      { name: "array", label: "Liste", placeholder: "liste" },
      { name: "target", label: "Speichern in", placeholder: "len" }
    ]
  };

  const listBlocks = [arrayLiteral, arrayAppend, arrayGet, arraySet, arrayLength];
  const mapBlocks = [objectLiteral, dictSet, dictGet, dictForEach];

  return { all: [...mapBlocks, ...listBlocks], list: listBlocks, map: mapBlocks };
})();

const paletteData = [
  {
    id: "action",
    title: "Aktionen",
    description: "Ausgaben, Variablen und Kommentare",
    blocks: [
      {
        type: "print",
        handler: "actions/print.js",
        label: "Text ausgeben",
        category: "action",
        icon: "🖨️",
        hint: "Nutze {{ }} um Variablen einzufügen, z.B. Ergebnis = {{a + b}}.",
        fields: [
          { name: "message", label: "Text / Ausdruck", placeholder: "i*k = {{i * k}}" }
        ]
      },
      {
        type: "set-variable",
        handler: "actions/set-variable.js",
        label: "Variable setzen",
        category: "action",
        icon: "🧮",
        hint: "Legt den Wert einer Variablen (ohne Objekt-Präfix) fest.",
        fields: [
          { name: "variable", label: "Name", placeholder: "z" },
          { name: "value", label: "Wert", placeholder: "42", defaultValue: "42" }
        ]
      },
      {
        type: "comment",
        handler: "actions/comment.js",
        label: "Kommentar",
        category: "comment",
        icon: "💬",
        hint: "Erklärt, was passieren soll.",
        fields: [
          { name: "text", label: "Hinweis", placeholder: "Beschreibe deinen Plan", multiline: true }
        ]
      }
    ]
  },
  {
    id: "logic",
    title: "Bedingungen",
    description: "If/Else und Prüfungen",
    blocks: [
      {
        type: "if",
        handler: "logic/if.js",
        label: "Wenn",
        category: "logic",
        icon: "🔀",
        hint: "Führt Blöcke nur aus, wenn die Bedingung wahr ist.",
        fields: [
          { name: "condition", label: "Bedingung", placeholder: "x > 10" }
        ],
        hasChildren: true,
        childrenLabel: "Dann ausführen"
      },
      {
        type: "compare",
        handler: "logic/compare.js",
        label: "Vergleich speichern",
        category: "logic",
        icon: "⚖️",
        fields: [
          { name: "left", label: "Links", placeholder: "wert" },
          { name: "operator", label: "Operator", placeholder: ">=" },
          { name: "right", label: "Rechts", placeholder: "10" },
          { name: "target", label: "Speichern in", placeholder: "vergleich" }
        ]
      },
      {
        type: "logic-combine",
        handler: "logic/logic-combine.js",
        label: "Logik kombinieren",
        category: "logic",
        icon: "➕",
        fields: [
          { name: "left", label: "Links", placeholder: "bedingung1" },
          { name: "operator", label: "Operator", placeholder: "&&" },
          { name: "right", label: "Rechts", placeholder: "bedingung2" },
          { name: "target", label: "Speichern in", placeholder: "result" }
        ]
      },
      {
        type: "if-else",
        handler: "logic/if-else.js",
        label: "Wenn / Sonst",
        category: "logic",
        icon: "🔀",
        fields: [{ name: "condition", label: "Bedingung", placeholder: "x > 0" }],
        hint: "Ein Block mit zwei Bereichen: oben wenn wahr, unten sonst.",
        childrenSections: [
          { name: "then", label: "Wenn wahr" },
          { name: "otherwise", label: "Sonst" }
        ]
      },
      {
        type: "else",
        handler: "logic/else.js",
        label: "Else (alt)",
        category: "logic",
        icon: "↪️",
        hint: "Nur für ältere Workspaces nötig – neuer Wenn/Sonst-Block hat beides.",
        hidden: true
      }
    ]
  },
  {
    id: "loop",
    title: "Schleifen",
    description: "Wiederholungen und Zähler",
    blocks: [
      {
        type: "repeat",
        handler: "loops/repeat.js",
        label: "Wiederhole",
        category: "loop",
        icon: "🔁",
        hint: "Führt die enthaltenen Blöcke mehrfach aus.",
        fields: [
          { name: "count", label: "Anzahl", placeholder: "3", type: "number", defaultValue: 3 }
        ],
        hasChildren: true,
        childrenLabel: "Körper"
      },
      {
        type: "for-range",
        handler: "loops/for-range.js",
        label: "Zähle von/bis",
        category: "loop",
        icon: "🪜",
        fields: [
          { name: "variable", label: "Zähler", placeholder: "i", defaultValue: "i" },
          { name: "from", label: "Start", placeholder: "0", type: "number", defaultValue: 0 },
          { name: "to", label: "Ende", placeholder: "5", type: "number", defaultValue: 5 }
        ],
        hasChildren: true,
        childrenLabel: "Rumpf"
      },
      {
        type: "while",
        handler: "loops/while.js",
        label: "Solange",
        category: "loop",
        icon: "🌀",
        hint: "Prüft eine Bedingung vor jeder Wiederholung.",
        fields: [
          { name: "condition", label: "Bedingung", placeholder: "energie > 0" }
        ],
        hasChildren: true,
        childrenLabel: "Block"
      },
      {
        type: "break",
        handler: "loops/break.js",
        label: "Break",
        category: "loop",
        icon: "⏹️"
      },
      {
        type: "continue",
        handler: "loops/continue.js",
        label: "Continue",
        category: "loop",
        icon: "⏭️"
      }
    ]
  },
  {
    id: "functions",
    title: "Funktionen",
    description: "Eigene Routinen und Rekursion",
    blocks: [
      {
        type: "function-def",
        handler: "functions/function-def.js",
        label: "Funktion definieren",
        category: "logic",
        icon: "🧩",
        fields: [
          { name: "name", label: "Name", placeholder: "mandel" },
          { name: "params", label: "Parameter", placeholder: "x, y, iter" }
        ],
        hasChildren: true,
        childrenLabel: "Funktionskörper"
      },
      {
        type: "function-call",
        handler: "functions/function-call.js",
        label: "Funktion aufrufen",
        category: "logic",
        icon: "📞",
        fields: [
          { name: "name", label: "Name", placeholder: "mandel" },
          { name: "args", label: "Argumente", placeholder: "x, y, iter" },
          { name: "target", label: "Speichere in", placeholder: "result" }
        ]
      },
      {
        type: "return",
        handler: "functions/return.js",
        label: "Wert zurückgeben",
        category: "logic",
        icon: "↩️",
        fields: [{ name: "value", label: "Ausdruck", placeholder: "iter" }]
      }
    ]
  },
  {
    id: "visual",
    title: "Visualisierung",
    description: "Pixel setzen und Canvas steuern",
    blocks: [
      {
        type: "clear-canvas",
        handler: "visual/clear-canvas.js",
        label: "Canvas leeren",
        category: "visual",
        icon: "🧼",
        hint: "Setzt die Zeichnung zurück."
      },
      {
        type: "plot-pixel",
        handler: "visual/plot-pixel.js",
        label: "Pixel setzen",
        category: "visual",
        icon: "🟦",
        fields: [
          { name: "x", label: "X", placeholder: "i" },
          { name: "y", label: "Y", placeholder: "k" },
          { name: "color", label: "Farbe / Ausdruck", placeholder: "#00ffaa" }
        ]
      },
      {
        type: "draw-rect",
        handler: "visual/draw-rect.js",
        label: "Rechteck füllen",
        category: "visual",
        icon: "▭",
        fields: [
          { name: "x", label: "X", placeholder: "0" },
          { name: "y", label: "Y", placeholder: "0" },
          { name: "width", label: "Breite", placeholder: "4" },
          { name: "height", label: "Höhe", placeholder: "4" },
          { name: "color", label: "Farbe", placeholder: "#ff8800" }
        ]
      },
      {
        type: "color-rgb",
        handler: "visual/color-rgb.js",
        label: "Farbe mischen",
        category: "visual",
        icon: "🌈",
        fields: [
          { name: "target", label: "Speichern in", placeholder: "farbe" },
          { name: "r", label: "Rot 0-255", placeholder: "255" },
          { name: "g", label: "Grün 0-255", placeholder: "128" },
          { name: "b", label: "Blau 0-255", placeholder: "0" }
        ]
      }
    ]
  },
  {
    id: "parameters",
    title: "Parameter",
    description: "Slider und Konstanten",
    blocks: [
      {
        type: "parameter-slider",
        handler: "actions/parameter-slider.js",
        label: "Parameter (Slider)",
        category: "action",
        icon: "🎚️",
        fields: [
          { name: "variable", label: "Variable", placeholder: "scale" },
          {
            name: "value",
            label: "Wert",
            type: "slider",
            min: 0,
            max: 100,
            step: 5,
            defaultValue: 50
          }
        ]
      }
    ]
  },
  {
    id: "data",
    title: "Daten",
    description: "Listen und Maps in eigenen Untermenüs.",
    blocks: dataBlocks.all,
    groups: [
      {
        title: "Listen",
        description: "Listen aufbauen, Elemente lesen/setzen.",
        blocks: dataBlocks.list
      },
      {
        title: "Maps / Objekte",
        description: "Key-Value-Strukturen lesen und schreiben.",
        blocks: dataBlocks.map
      }
    ]
  },
  {
    id: "structure",
    title: "Struktur",
    description: "Container & Namespaces",
    blocks: [
      {
        type: "object-def",
        handler: "logic/object-def.js",
        label: "Objekt",
        category: "logic",
        icon: "🧳",
        hint: "Definiert Eigenschaften und Methoden (Name wird als Prefix genutzt).",
        fields: [{ name: "name", label: "Name", placeholder: "raum" }],
        childrenSections: [
          { name: "properties", label: "Eigenschaften" },
          { name: "methods", label: "Funktionen" }
        ]
      },
      {
        type: "object-property",
        handler: "logic/object-property.js",
        label: "Objekt-Eigenschaft setzen",
        category: "logic",
        icon: "🔧",
        hint: "Innerhalb eines Objekt-Blocks wird eine Eigenschaft mit Prefix gesetzt, sonst wie Variable setzen.",
        fields: [
          { name: "name", label: "Name", placeholder: "x" },
          { name: "value", label: "Wert", placeholder: "0" }
        ]
      }
    ]
  },
  {
    id: "parallel",
    title: "Chunks",
    description: "Arbeit in Bereiche aufteilen",
    blocks: [
      {
        type: "parallel-grid",
        handler: "loops/parallel-grid.js",
        label: "Chunk-Schleife",
        category: "loop",
        icon: "🧩",
        hint: "Durchläuft das Raster in Kacheln (Pseudo-Parallel).",
        fields: [
          { name: "width", label: "Breite", placeholder: "width" },
          { name: "height", label: "Höhe", placeholder: "height" },
          { name: "chunkWidth", label: "Chunk Breite", placeholder: "4" },
          { name: "chunkHeight", label: "Chunk Höhe", placeholder: "4" },
          { name: "xVar", label: "Variable X", placeholder: "chunkX" },
          { name: "yVar", label: "Variable Y", placeholder: "chunkY" }
        ],
        hasChildren: true,
        childrenLabel: "Chunk Körper"
      }
    ]
  }
];

const blockMap = new Map();
paletteData.forEach((category) => {
  category.blocks.forEach((block) => blockMap.set(block.type, block));
});

LernProg.paletteData = paletteData;
LernProg.getBlockDefinition = function getBlockDefinition(type) {
  return blockMap.get(type);
};
