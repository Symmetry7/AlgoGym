// Starter stubs and hidden harnesses for every language, generated from meta.json's signature.
// Harness contract: docs/SYSTEM_ARCHITECTURE.md §4.2 (one process, one flushed JSON line per case, stop when the budget runs out).

export const LANGUAGES = ["javascript", "python", "cpp", "java"];
export const TYPES = ["int", "long", "double", "bool", "string", "int[]", "long[]", "double[]", "bool[]", "string[]", "int[][]", "string[][]"];

// File names users see in the editor and authors use for solutions and overrides.
export const SOLUTION_FILE = { javascript: "solution.js", python: "solution.py", cpp: "solution.cpp", java: "Solution.java" };
export const HARNESS_FILE = { javascript: "harness.js", python: "harness.py", cpp: "harness.cpp", java: "Main.java" };

// The worker replaces these three markers per job (see combine()).
export const USER_CODE = "__AG_USER_CODE__";
const NONCE = "__AG_NONCE__";
const BUDGET = "__AG_BUDGET_MS__";

const depth = (t) => (t.endsWith("[][]") ? 2 : t.endsWith("[]") ? 1 : 0);
const base = (t) => t.replace(/\[\]/g, "");

const scalar = {
  int: { js: "number", py: "int", cpp: "int", java: "int", javaDefault: "0" },
  long: { js: "number", py: "int", cpp: "long long", java: "long", javaDefault: "0" },
  double: { js: "number", py: "float", cpp: "double", java: "double", javaDefault: "0.0" },
  bool: { js: "boolean", py: "bool", cpp: "bool", java: "boolean", javaDefault: "false" },
  string: { js: "string", py: "str", cpp: "string", java: "String", javaDefault: "null" },
};
const wrap = (t, s, open, close) => { let out = s; for (let i = 0; i < depth(t); i++) out = open + out + close; return out; };

export const typeName = {
  javascript: (t) => scalar[base(t)].js + "[]".repeat(depth(t)),
  python: (t) => wrap(t, scalar[base(t)].py, "list[", "]"),
  cpp: (t) => wrap(t, scalar[base(t)].cpp, "vector<", ">"),
  java: (t) => scalar[base(t)].java + "[]".repeat(depth(t)),
};

function assertSignature(sig) {
  for (const t of [...sig.params.map((p) => p.type), sig.returns]) if (!TYPES.includes(t)) throw new Error(`Unsupported type ${t}`);
}

export function starter(sig, language) {
  assertSignature(sig);
  const { function: fn, params, returns } = sig;
  const names = params.map((p) => p.name).join(", ");
  switch (language) {
    case "javascript":
      return `/**\n${params.map((p) => ` * @param {${typeName.javascript(p.type)}} ${p.name}\n`).join("")} * @return {${typeName.javascript(returns)}}\n */\nfunction ${fn}(${names}) {\n  \n}\n`;
    case "python":
      return `class Solution:\n    def ${fn}(self, ${params.map((p) => `${p.name}: ${typeName.python(p.type)}`).join(", ")}) -> ${typeName.python(returns)}:\n        pass\n`;
    case "cpp": {
      const arg = (p) => `${typeName.cpp(p.type)}${depth(p.type) ? "&" : ""} ${p.name}`;
      return `class Solution {\npublic:\n    ${typeName.cpp(returns)} ${fn}(${params.map(arg).join(", ")}) {\n        \n        return {};\n    }\n};\n`;
    }
    case "java": {
      const ret = depth(returns) ? "null" : scalar[returns].javaDefault;
      return `class Solution {\n    public ${typeName.java(returns)} ${fn}(${params.map((p) => `${typeName.java(p.type)} ${p.name}`).join(", ")}) {\n        \n        return ${ret};\n    }\n}\n`;
    }
  }
  throw new Error(`Unknown language ${language}`);
}

// Java/C++ reader and writer helper names per type, e.g. "int[][]" -> "IntAA".
const helper = (t) => base(t)[0].toUpperCase() + base(t).slice(1) + "A".repeat(depth(t));

export function harness(sig, language) {
  assertSignature(sig);
  const { function: fn, params, returns } = sig;
  switch (language) {
    case "javascript":
      return `${USER_CODE}
;(() => {
  const fs__ = require("fs");
  const lines__ = fs__.readFileSync(0, "utf8").split("\\n").filter((l) => l.trim());
  const t0__ = performance.now();
  for (let k__ = 0; k__ < lines__.length; k__++) {
    if (performance.now() - t0__ >= ${BUDGET}) break;
    const args__ = JSON.parse(lines__[k__]);
    let rec__;
    try {
      const c__ = performance.now();
      const r__ = ${fn}(...args__);
      rec__ = { n: "${NONCE}", case: k__ + 1, ms: performance.now() - c__, output: r__ === undefined ? null : r__ };
    } catch (e__) {
      rec__ = { n: "${NONCE}", case: k__ + 1, error: String(e__ && e__.stack ? e__.stack : e__) };
    }
    fs__.writeSync(1, "\\n" + JSON.stringify(rec__) + "\\n");
  }
})();
`;
    case "python":
      return `import sys, json, time, threading
from typing import *
${USER_CODE}


def __ag_main():
    lines = [l for l in sys.stdin.read().split("\\n") if l.strip()]
    t0 = time.perf_counter()
    for k, line in enumerate(lines, 1):
        if (time.perf_counter() - t0) * 1000 >= ${BUDGET}:
            break
        args = json.loads(line)
        try:
            c = time.perf_counter()
            r = Solution().${fn}(*args)
            rec = json.dumps({"n": "${NONCE}", "case": k, "ms": (time.perf_counter() - c) * 1000, "output": r}, separators=(",", ":"))
        except BaseException as e:
            rec = json.dumps({"n": "${NONCE}", "case": k, "error": type(e).__name__ + ": " + str(e)}, separators=(",", ":"))
        sys.stdout.write("\\n" + rec + "\\n")
        sys.stdout.flush()


sys.setrecursionlimit(1_000_000)
threading.stack_size(128 * 1024 * 1024)
__ag_t = threading.Thread(target=__ag_main)
__ag_t.start()
__ag_t.join()
`;
    case "cpp": {
      const reads = params.map((p, i) => `${i ? "in.expect(',');\n        " : ""}${typeName.cpp(p.type)} a_${p.name}; ag::rd(in, a_${p.name});`).join("\n        ");
      return `#include <bits/stdc++.h>
using namespace std;
${USER_CODE}
namespace ag {
struct In {
    const string& s; size_t i;
    void ws() { while (i < s.size() && isspace((unsigned char)s[i])) i++; }
    void expect(char c) { ws(); if (i >= s.size() || s[i] != c) throw runtime_error(string("harness: expected ") + c); i++; }
    bool peek(char c) { ws(); return i < s.size() && s[i] == c; }
};
inline void rd(In& in, long long& v) { in.ws(); size_t n = 0; v = stoll(in.s.substr(in.i, 24), &n); in.i += n; }
inline void rd(In& in, int& v) { long long x; rd(in, x); v = (int)x; }
inline void rd(In& in, double& v) { in.ws(); size_t n = 0; v = stod(in.s.substr(in.i, 40), &n); in.i += n; }
inline void rd(In& in, bool& v) { in.ws(); v = in.s.compare(in.i, 4, "true") == 0; in.i += v ? 4 : 5; }
inline void utf8(string& o, unsigned c) {
    if (c < 0x80) o += (char)c;
    else if (c < 0x800) { o += (char)(0xC0 | (c >> 6)); o += (char)(0x80 | (c & 63)); }
    else if (c < 0x10000) { o += (char)(0xE0 | (c >> 12)); o += (char)(0x80 | ((c >> 6) & 63)); o += (char)(0x80 | (c & 63)); }
    else { o += (char)(0xF0 | (c >> 18)); o += (char)(0x80 | ((c >> 12) & 63)); o += (char)(0x80 | ((c >> 6) & 63)); o += (char)(0x80 | (c & 63)); }
}
inline void rd(In& in, string& v) {
    in.expect('"'); v.clear();
    while (in.s[in.i] != '"') {
        char c = in.s[in.i++];
        if (c != '\\\\') { v += c; continue; }
        char e = in.s[in.i++];
        if (e == 'n') v += '\\n'; else if (e == 't') v += '\\t'; else if (e == 'r') v += '\\r';
        else if (e == 'b') v += '\\b'; else if (e == 'f') v += '\\f';
        else if (e == 'u') {
            unsigned c1 = stoul(in.s.substr(in.i, 4), nullptr, 16); in.i += 4;
            if (c1 >= 0xD800 && c1 < 0xDC00) { unsigned c2 = stoul(in.s.substr(in.i + 2, 4), nullptr, 16); in.i += 6; c1 = 0x10000 + ((c1 - 0xD800) << 10) + (c2 - 0xDC00); }
            utf8(v, c1);
        } else v += e;
    }
    in.i++;
}
template <class T> void rd(In& in, vector<T>& v) {
    in.expect('['); v.clear();
    if (in.peek(']')) { in.i++; return; }
    while (true) { T x; rd(in, x); v.push_back(x); if (in.peek(',')) { in.i++; continue; } in.expect(']'); return; }
}
inline void wr(ostream& o, int v) { o << v; }
inline void wr(ostream& o, long long v) { o << v; }
inline void wr(ostream& o, bool v) { o << (v ? "true" : "false"); }
inline void wr(ostream& o, double v) { if (!isfinite(v)) { o << "null"; return; } char b[32]; snprintf(b, sizeof b, "%.17g", v); o << b; }
inline void wr(ostream& o, const string& v) {
    o << '"';
    for (unsigned char c : v) {
        if (c == '"' || c == '\\\\') o << '\\\\' << c;
        else if (c < 0x20) { char b[8]; snprintf(b, sizeof b, "\\\\u%04x", c); o << b; }
        else o << c;
    }
    o << '"';
}
template <class T> void wr(ostream& o, const vector<T>& v) {
    o << '[';
    for (size_t i = 0; i < v.size(); i++) { if (i) o << ','; wr(o, (T)v[i]); }
    o << ']';
}
inline double since(chrono::steady_clock::time_point t) { return chrono::duration<double, milli>(chrono::steady_clock::now() - t).count(); }
}

int main() {
    ios::sync_with_stdio(false);
    vector<string> lines; string line;
    while (getline(cin, line)) if (line.find_first_not_of(" \\t\\r") != string::npos) lines.push_back(line);
    auto t0 = chrono::steady_clock::now();
    for (size_t k = 0; k < lines.size(); k++) {
        if (ag::since(t0) >= ${BUDGET}) break;
        ostringstream o;
        o << "\\n{\\"n\\":\\"${NONCE}\\",\\"case\\":" << k + 1 << ',';
        try {
            ag::In in{lines[k], 0};
            in.expect('[');
        ${reads}
            in.expect(']');
            auto c = chrono::steady_clock::now();
            ${typeName.cpp(returns)} r = Solution().${fn}(${params.map((p) => "a_" + p.name).join(", ")});
            double ms = ag::since(c);
            o << "\\"ms\\":" << ms << ",\\"output\\":"; ag::wr(o, r);
        } catch (const exception& e) {
            o << "\\"error\\":"; ag::wr(o, string(e.what()));
        } catch (...) {
            o << "\\"error\\":\\"unknown exception\\"";
        }
        o << "}\\n";
        cout << o.str() << flush;
    }
}
`;
    }
    case "java": {
      const reads = params.map((p, i) => `${i ? "in.expect(',');\n                " : ""}${typeName.java(p.type)} a_${p.name} = r${helper(p.type)}(in);`).join("\n                ");
      return `import java.util.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
${USER_CODE}
public class Main {
    static final class In {
        final String s; int i;
        In(String s) { this.s = s; }
        void ws() { while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++; }
        void expect(char c) { ws(); if (i >= s.length() || s.charAt(i) != c) throw new IllegalStateException("harness: expected " + c); i++; }
        boolean peek(char c) { ws(); return i < s.length() && s.charAt(i) == c; }
        String number() { ws(); int j = i; while (j < s.length() && "+-0123456789.eE".indexOf(s.charAt(j)) >= 0) j++; String t = s.substring(i, j); i = j; return t; }
    }
    interface R<T> { T read(In in); }
    static <T> List<T> rList(In in, R<T> f) {
        List<T> out = new ArrayList<>();
        in.expect('[');
        if (in.peek(']')) { in.i++; return out; }
        while (true) { out.add(f.read(in)); if (in.peek(',')) { in.i++; continue; } in.expect(']'); return out; }
    }
    static long rLong(In in) { return Long.parseLong(in.number()); }
    static int rInt(In in) { return (int) rLong(in); }
    static double rDouble(In in) { return Double.parseDouble(in.number()); }
    static boolean rBool(In in) { in.ws(); boolean v = in.s.startsWith("true", in.i); in.i += v ? 4 : 5; return v; }
    static String rString(In in) {
        in.expect('"');
        StringBuilder b = new StringBuilder();
        while (in.s.charAt(in.i) != '"') {
            char c = in.s.charAt(in.i++);
            if (c != '\\\\') { b.append(c); continue; }
            char e = in.s.charAt(in.i++);
            switch (e) {
                case 'n': b.append('\\n'); break; case 't': b.append('\\t'); break; case 'r': b.append('\\r'); break;
                case 'b': b.append('\\b'); break; case 'f': b.append('\\f'); break;
                case 'u': b.append((char) Integer.parseInt(in.s.substring(in.i, in.i + 4), 16)); in.i += 4; break;
                default: b.append(e);
            }
        }
        in.i++;
        return b.toString();
    }
    static int[] rIntA(In in) { return rList(in, Main::rLong).stream().mapToInt(Long::intValue).toArray(); }
    static long[] rLongA(In in) { return rList(in, Main::rLong).stream().mapToLong(Long::longValue).toArray(); }
    static double[] rDoubleA(In in) { return rList(in, Main::rDouble).stream().mapToDouble(Double::doubleValue).toArray(); }
    static boolean[] rBoolA(In in) { List<Boolean> l = rList(in, Main::rBool); boolean[] a = new boolean[l.size()]; for (int i = 0; i < a.length; i++) a[i] = l.get(i); return a; }
    static String[] rStringA(In in) { return rList(in, Main::rString).toArray(new String[0]); }
    static int[][] rIntAA(In in) { return rList(in, Main::rIntA).toArray(new int[0][]); }
    static String[][] rStringAA(In in) { return rList(in, Main::rStringA).toArray(new String[0][]); }

    static void wInt(StringBuilder o, int v) { o.append(v); }
    static void wLong(StringBuilder o, long v) { o.append(v); }
    static void wDouble(StringBuilder o, double v) { if (Double.isFinite(v)) o.append(v); else o.append("null"); }
    static void wBool(StringBuilder o, boolean v) { o.append(v); }
    static void wString(StringBuilder o, String v) {
        if (v == null) { o.append("null"); return; }
        o.append('"');
        for (int i = 0; i < v.length(); i++) {
            char c = v.charAt(i);
            if (c == '"' || c == '\\\\') o.append('\\\\').append(c);
            else if (c < 0x20) o.append(String.format("\\\\u%04x", (int) c));
            else o.append(c);
        }
        o.append('"');
    }
    static void wIntA(StringBuilder o, int[] v) { if (v == null) { o.append("null"); return; } o.append('['); for (int i = 0; i < v.length; i++) { if (i > 0) o.append(','); o.append(v[i]); } o.append(']'); }
    static void wLongA(StringBuilder o, long[] v) { if (v == null) { o.append("null"); return; } o.append('['); for (int i = 0; i < v.length; i++) { if (i > 0) o.append(','); o.append(v[i]); } o.append(']'); }
    static void wDoubleA(StringBuilder o, double[] v) { if (v == null) { o.append("null"); return; } o.append('['); for (int i = 0; i < v.length; i++) { if (i > 0) o.append(','); wDouble(o, v[i]); } o.append(']'); }
    static void wBoolA(StringBuilder o, boolean[] v) { if (v == null) { o.append("null"); return; } o.append('['); for (int i = 0; i < v.length; i++) { if (i > 0) o.append(','); o.append(v[i]); } o.append(']'); }
    static void wStringA(StringBuilder o, String[] v) { if (v == null) { o.append("null"); return; } o.append('['); for (int i = 0; i < v.length; i++) { if (i > 0) o.append(','); wString(o, v[i]); } o.append(']'); }
    static void wIntAA(StringBuilder o, int[][] v) { if (v == null) { o.append("null"); return; } o.append('['); for (int i = 0; i < v.length; i++) { if (i > 0) o.append(','); wIntA(o, v[i]); } o.append(']'); }
    static void wStringAA(StringBuilder o, String[][] v) { if (v == null) { o.append("null"); return; } o.append('['); for (int i = 0; i < v.length; i++) { if (i > 0) o.append(','); wStringA(o, v[i]); } o.append(']'); }

    static void run() throws IOException {
        PrintStream out = new PrintStream(new FileOutputStream(FileDescriptor.out), true, "UTF-8");
        System.setOut(out);
        String[] lines = new String(System.in.readAllBytes(), StandardCharsets.UTF_8).split("\\n");
        long t0 = System.nanoTime();
        int k = 0;
        for (String line : lines) {
            if (line.trim().isEmpty()) continue;
            k++;
            if ((System.nanoTime() - t0) / 1e6 >= ${BUDGET}) break;
            StringBuilder o = new StringBuilder("\\n{\\"n\\":\\"${NONCE}\\",\\"case\\":").append(k).append(',');
            try {
                In in = new In(line);
                in.expect('[');
                ${reads}
                in.expect(']');
                long c = System.nanoTime();
                ${typeName.java(returns)} r = new Solution().${fn}(${params.map((p) => "a_" + p.name).join(", ")});
                double ms = (System.nanoTime() - c) / 1e6;
                o.append("\\"ms\\":").append(ms).append(",\\"output\\":");
                w${helper(returns)}(o, r);
            } catch (Throwable e) {
                o.setLength(0);
                o.append("\\n{\\"n\\":\\"${NONCE}\\",\\"case\\":").append(k).append(",\\"error\\":");
                wString(o, e.toString());
            }
            out.print(o.append("}\\n"));
            out.flush();
        }
    }

    public static void main(String[] args) throws Exception {
        Throwable[] failure = new Throwable[1];
        Thread t = new Thread(null, () -> { try { run(); } catch (Throwable e) { failure[0] = e; } }, "main", 256L << 20);
        t.start();
        t.join();
        if (failure[0] != null) throw new RuntimeException(failure[0]);
    }
}
`;
    }
  }
  throw new Error(`Unknown language ${language}`);
}

// Fill a harness for one job. The nonce marks result lines so anything user code prints is console output, not a result.
export function combine(harnessCode, userCode, { nonce, budgetMs }) {
  if (!harnessCode.includes(USER_CODE)) throw new Error(`Harness has no ${USER_CODE} marker`);
  return harnessCode.split(NONCE).join(nonce).split(BUDGET).join(String(budgetMs)).replace(USER_CODE, () => userCode);
}
