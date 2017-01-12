/* global atom */

var path = require("path");
var findRoot = require("find-root");
var prettier = require("prettier");

module.exports = {
  style: null,
  fileTypes: [ ".js", ".jsx" ],
  prettierCoreOptions: [
    "printWidth",
    "tabWidth",
    "useFlowParser",
    "singleQuote",
    "trailingComma",
    "bracketSpacing",
    "arrowParensAlways"
  ],
  fileSupported: function(file) {
    // Ensure file is a supported file type.
    var ext = path.extname(file);
    return !!~this.fileTypes.indexOf(ext);
  },
  activate: function() {
    this.commands = atom.commands.add(
      "atom-workspace",
      "prettier:format",
      function() {
        this.format();
      }.bind(this)
    );

    this.editorObserver = atom.workspace.observeTextEditors(
      this.handleEvents.bind(this)
    );
  },
  deactivate: function() {
    this.commands.dispose();
    this.editorObserver.dispose();
  },
  format: function(options) {
    if (options === undefined) {
      options = {};
    }
    var selection = typeof options.selection === "undefined"
      ? true
      : !!options.selection;
    var editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      // Return if the current active item is not a `TextEditor`
      return;
    }
    var selectedText = selection ? editor.getSelectedText() : null;
    var text = selectedText || editor.getText();
    var cursorPosition = editor.getCursorScreenPosition();

    var formatOptions = {};
    this.prettierCoreOptions.forEach(function(option) {
      formatOptions[option] = typeof options[option] !== "undefined"
        ? options[option]
        : atom.config.get("prettier-atom." + option);
    });

    try {
      var transformed = prettier.format(text, formatOptions);
    } catch (e) {
      console.log("Error transforming using prettier:", e);
      transformed = text;
    }

    if (selectedText) {
      editor.setTextInBufferRange(editor.getSelectedBufferRange(), transformed);
    } else {
      editor.setText(transformed);
    }
    editor.setCursorScreenPosition(cursorPosition);
  },
  handleEvents: function(editor) {
    editor.getBuffer().onWillSave(
      function() {
        var path = editor.getPath();
        if (!path)
          return;

        if (!editor.getBuffer().isModified())
          return;

        var formatOnSave = atom.config.get("prettier-atom.formatOnSave", {
          scope: editor.getRootScopeDescriptor()
        });
        if (!formatOnSave)
          return;

        // Set the relative path based on the file's nearest package.json.
        // If no package.json is found, use path verbatim.
        var relativePath;
        try {
          var projectPath = findRoot(path);
          relativePath = path.replace(projectPath, "").substring(1);
        } catch (e) {
          relativePath = path;
        }

        if (this.fileSupported(relativePath)) {
          this.format({ selection: false });
        }
      }.bind(this)
    );
    // Uncomment this to format on resize. Not ready yet. :)
    //
    // if (editor.editorElement) {
    //   window.addEventListener("resize", e => {
    //     const { width } = window.document.body.getBoundingClientRect();
    //     const columns = width /
    //       editor.editorElement.getDefaultCharacterWidth() |
    //       0;
    //     console.log(width, columns);
    //     this.format({ selection: false, printWidth: columns });
    //   });
    // }
  },
  config: {
    formatOnSave: { type: "boolean", default: false, order: 1 },
    printWidth: { type: "integer", default: 80, order: 2 },
    tabWidth: { type: "integer", default: 2, order: 3 },
    singleQuote: { type: "boolean", default: false, order: 4 },
    trailingComma: { type: "boolean", default: false, order: 5 },
    bracketSpacing: { type: "boolean", default: true, order: 6 },
    useFlowParser: { type: "boolean", default: false, order: 7 },
    arrowParensAlways: { type: "boolean", default: false, order: 8 }
  }
};
