class Solution:
    def finalDocument(self, actions: list[str]) -> str:
        document: list[str] = []
        redo: list[str] = []
        for action in actions:
            if action == "<":
                if document:
                    redo.append(document.pop())
            elif action == ">":
                if redo:
                    document.append(redo.pop())
            else:
                document.append(action)
                redo.clear()
        return " ".join(document)
