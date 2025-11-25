# LernProg – Blockbasierter Editor (Prototyp)

Dieses Projekt ist ein erster klickbarer Prototyp für das Lernprogramm aus den Anforderungen. Alle klassischen Anweisungen werden als farbig kodierte "Lego"-Steine dargestellt, die man in Sequenzen und Container-Blöcke stecken kann.

## Starten

Da es sich um eine reine Frontend-Anwendung handelt, reicht ein lokaler Webserver. Beispielsweise:

```bash
npx serve .
```

Alternativ kannst du `index.html` direkt im Browser öffnen.

## Funktionsumfang

- **Palette:** Aktionen (Ausgabe, Variablen, Kommentare), Bedingungen (Wenn), Schleifen (Repeat, For-Range, While). Neue Blöcke lassen sich per Klick erzeugen.
- **Arbeitsfläche:** Blocks lassen sich per Drag & Drop umsortieren und in Container-Blöcke verschachteln. Jeder Block hat Eingabefelder für relevante Parameter.
- **Code-Vorschau & Ausführung:** Aus dem Blockaufbau wird automatisch eine Python-ähnliche Repräsentation gerendert (farblich passend zu den Block-Kategorien). Über „Programm ausführen“ läuft das Programm automatisch, über „Schritt“ kannst du Schritt für Schritt debuggen.
- **Funktionen & Rekursion:** Eigene Funktionen lassen sich definieren, aufrufen und rekursiv verschachteln. `return`-Blöcke stoppen den aktuellen Stack-Frame, und das Register visualisiert automatisch die Call-Frames.
- **Visualisierung:** Eine integrierte Zeichenfläche ermöglicht das Setzen von Pixeln direkt aus den Blöcken heraus – ideal, um z.B. eine Mandelbrotmenge zu rendern. Canvas-Operationen tauchen ebenfalls in der Schritt-für-Schritt-Animation auf.
- **Datenblöcke:** Dictionary-Lesen/-Schreiben erleichtert Agentensimulationen (z.B. Turmite). Du musst keinen JavaScript-Spread mehr tippen – Schlüssel/Werte werden direkt im Block eingegeben.
- **Parameter & Farben:** Slider-Blöcke erzeugen konstante Werte ohne Textfelder, Farbmischer und neue Canvas-Bausteine (Pixel/Rechteck) machen visuelle Projekte übersichtlicher. Chunk-Schleifen helfen, große Aufgaben in Kacheln aufzuteilen.
- **Variablenregister & Tempo:** Jeder Schritt aktualisiert ein „Heap“-Panel, das alle aktuell aktiven Frames/Variablen inklusive Listenwerte zeigt. Ein Tempo-Regler steuert die Animationsgeschwindigkeit, verlassene Scopes verschwinden automatisch.
- **Export/Import:** Über die Buttons im Workspace kannst du den aktuellen Blockaufbau als JSON exportieren oder wieder laden – perfekt, um Mandelbrot-Experimente zu sichern oder zu teilen.
- **Ausdrücke im Textblock:** Schreibe statischen Text einfach so wie er erscheinen soll. Um Variablen oder Rechnungen einzufügen, nutze doppelte geschweifte Klammern, z.B. `Produkt von {{i}} und {{k}} = {{i * k}}`.
- **Hilfsfunktionen:** Blöcke können gelöscht werden, es gibt einen Reset-Button und die Vorschau lässt sich ein-/ausblenden.

## Ideen für die nächsten Schritte

1. **Else/Else-If und weitere Blocktypen** (Funktionen, Eingaben, Datenstrukturen).
2. **Aufgaben/Level-System** mit automatischen Tests gegen Referenzausgaben.
3. **Speichern & Teilen** mittels JSON- oder AST-Export.
4. **A11y & Mobile**: Tastatursteuerung der Blöcke, Touch-Optimierung.
5. **Syntax-Highlighting & echte Code-Generierung** für mehrere Sprachen.

Viel Spaß beim Ausprobieren! Feedback gerne direkt aufschreiben, die Architektur lässt sich leicht erweitern.
