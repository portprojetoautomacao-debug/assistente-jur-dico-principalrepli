export function debugEditorStyles(selector = ".tiptap.ProseMirror") {
  if (globalThis.window === undefined) return;
  const editor = document.querySelector(selector) as HTMLElement;
  if (!editor) {
    console.warn("Editor not found for selector:", selector);
    return;
  }

  const styles = globalThis.window.getComputedStyle(editor);

  console.log("Editor Computed Styles:", {
    opacity: styles.opacity,
    filter: styles.filter,
    backdropFilter: styles.backdropFilter,
    backgroundColor: styles.backgroundColor,
    visibility: styles.visibility,
    display: styles.display,
    zIndex: styles.zIndex,
    transform: styles.transform,
    position: styles.position,
  });

  let parent = editor.parentElement;
  let level = 0;
  while (parent && level < 8) {
    const parentStyles = globalThis.window.getComputedStyle(parent);

    console.log(`Parent level ${level} (${parent.className || parent.nodeName}):`, {
      opacity: parentStyles.opacity,
      filter: parentStyles.filter,
      backdropFilter: parentStyles.backdropFilter,
      transform: parentStyles.transform,
      zIndex: parentStyles.zIndex,
      position: parentStyles.position,
    });
    parent = parent.parentElement;
    level++;
  }
}

// Attach to window for quick debugging in dev
if (globalThis.window !== undefined) {
  // @ts-expect-error - globalThis.window.debugEditor is added dynamically in dev
  globalThis.window.debugEditor = debugEditorStyles;
}

export default debugEditorStyles;
