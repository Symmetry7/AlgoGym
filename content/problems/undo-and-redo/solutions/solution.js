function finalDocument(actions) {
  const document = [];
  const redo = [];
  for (const action of actions) {
    if (action === "<") {
      if (document.length) redo.push(document.pop());
    } else if (action === ">") {
      if (redo.length) document.push(redo.pop());
    } else {
      document.push(action);
      redo.length = 0;
    }
  }
  return document.join(" ");
}
