/* global atom */

const path = require("path");
const findRoot = require("find-root");
const prettier = require("prettier");

module.exports = {
  style: null,
  fileTypes: [ ".js", ".jsx" ],
  prettierCoreOptions: [
    "printWidth",
    "tabWidth",
    "useFlowParser",
    "singleQuote",
    "trailingComma",
    "bracketSpacing"
  ],
  fileSupported: (file)=> {
    // Ensure file is a supported file type.
    var ext = path.extname(file);
    return !!~this.fileTypes.indexOf(ext);
  },
  activate: ()=> {
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
  deactivate: ()=> {
    this.commands.dispose();
    this.editorObserver.dispose();
  },
  format: (options)=> {
    if (options === undefined) {
      options = {};
    }
    let selection = typeof options.selection === "undefined"
      ? true
      : !!options.selection;
    let editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      // Return if the current active item is not a `TextEditor`
      return;
    }
    let selectedText = selection ? editor.getSelectedText() : null;
    let text = selectedText || editor.getText();
    let cursorPosition = editor.getCursorScreenPosition();

    let formatOptions = {};
    this.prettierCoreOptions.forEach((option)=> {
      formatOptions[option] = typeof options[option] !== "undefined"
        ? options[option]
        : atom.config.get("prettier-atom." + option);
    });

    try {
      let transformed = prettier.format(text, formatOptions);
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
  handleEvents: (editor)=> {
    editor.getBuffer().onWillSave(
      ()=> {
        let path = editor.getPath();
        if (!path)
          return;

        if (!editor.getBuffer().isModified())
          return;

        let formatOnSave = atom.config.get("prettier-atom.formatOnSave", {
          scope: editor.getRootScopeDescriptor()
        });
        if (!formatOnSave)
          return;

        // Set the relative path based on the file's nearest package.json.
        // If no package.json is found, use path verbatim.
        let relativePath;
        try {
          let projectPath = findRoot(path);
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
    formatOnSave: {
      title: "Format on Save",
      description: "Format Javascript files when saving",
      type: "boolean",
      default: false,
      order: 1
    },
    printWidth: {
      title: "Print Width",
      description: "Fit code within this line limit",
      type: "integer",
      default: 80,
      order: 2
    },
    tabWidth: {
      title: "Tab Width",
      description: "Number of spaces it should use per tab",
      type: "integer",
      default: 2,
      order: 3
    },
    singleQuote: {
      title: "Single Quote",
      description: "If true, will use single instead of double quotes",
      type: "boolean",
      default: false,
      order: 4
    },
    trailingComma: {
      title: "Trailing Comma",
      description: "Controls the printing of trailing commas wherever possible",
      type: "boolean",
      default: false,
      order: 5
    },
    bracketSpacing: {
      title: "Bracket Spacing",
      description: "Controls the printing of spaces inside array and objects",
      type: "boolean",
      default: true,
      order: 6
    },
    useFlowParser: {
      title: "Use Flow Parser",
      description: "Use the [flow](https://github.com/facebook/flow) parser instead of "
        + "[babylon](https://github.com/babel/babylon).",
      type: "boolean",
      default: false,
      order: 7
    }
  }
};
