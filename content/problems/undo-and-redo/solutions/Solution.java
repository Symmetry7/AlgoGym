import java.util.ArrayList;

class Solution {
    public String finalDocument(String[] actions) {
        ArrayList<String> document = new ArrayList<>();
        ArrayList<String> redo = new ArrayList<>();
        for (String action : actions) {
            if (action.equals("<")) {
                if (!document.isEmpty()) redo.add(document.remove(document.size() - 1));
            } else if (action.equals(">")) {
                if (!redo.isEmpty()) document.add(redo.remove(redo.size() - 1));
            } else {
                document.add(action);
                redo.clear();
            }
        }
        return String.join(" ", document);
    }
}
