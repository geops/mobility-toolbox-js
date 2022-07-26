class MyPlugin {
  onStart(ev) {
    console.log(ev.data);
  }

  onHandlePlugins(ev) {
    console.log('lala');
    // modify plugins
    //   ev.data.plugins = ...;
  }

  onHandleConfig(ev) {
    console.log('lala');
    // modify config
    //   ev.data.config.title = ...;
  }

  onHandleCode(ev) {
    console.log('lala');
    // modify code
    //   ev.data.code = ...;
  }

  onHandleCodeParser(ev) {
    console.log('lala');
    // modify parser
    //   ev.data.parser = function(code){ ... };
  }

  onHandleAST(ev) {
    // modify AST
    console.log('lala');
    //   ev.data.ast = ...;
  }

  onHandleDocs(ev) {
    console.log('lala');
    // modify docs
    //   ev.data.docs = ...;
  }

  onPublish(ev) {
    console.log('lala');
    // write content to output dir
    //   ev.data.writeFile(filePath, content);

    // copy file to output dir
    //   ev.data.copyFile(src, dest);

    // copy dir to output dir
    //   ev.data.copyDir(src, dest);

    // read file from output dir
    //   ev.data.readFile(filePath);
  }

  onHandleContent(ev) {
    // modify content
    //   ev.data.content = ...;
    console.log('lala');
  }

  onComplete(ev) {
    // complete
  }
}

// exports plugin
module.exports = new MyPlugin();
