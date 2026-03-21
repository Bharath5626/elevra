import { useRef, useCallback } from 'react';
import { Code2, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#',
  'Go', 'Rust', 'SQL', 'Bash', 'Other',
];

// Pairs: opening char → closing char
const PAIRS: Record<string, string> = {
  '(':  ')',
  '[':  ']',
  '{':  '}',
  '"':  '"',
  "'":  "'",
  '`':  '`',
};
// All closing chars (used to skip-over on type)
const CLOSING = new Set(Object.values(PAIRS));

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  fillHeight?: boolean;
}

export default function CodeEditor({ value, onChange, language, onLanguageChange, fillHeight = false }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end   = ta.selectionEnd;

    // ── Tab → insert 4 spaces ────────────────────────────────────────────────
    if (e.key === 'Tab') {
      e.preventDefault();
      const next = value.substring(0, start) + '    ' + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
      return;
    }

    // ── Enter → auto-indent ──────────────────────────────────────────────────
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart  = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      const indent     = currentLine.match(/^(\s*)/)?.[1] ?? '';
      // Extra indent after opening bracket on the same line
      const lastChar   = currentLine.trimEnd().slice(-1);
      const extraIndent = (lastChar === '{' || lastChar === '(' || lastChar === '[') ? '    ' : '';
      const next = value.substring(0, start) + '\n' + indent + extraIndent + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 1 + indent.length + extraIndent.length;
      });
      return;
    }

    // ── Backspace → delete matching pair if cursor is between them ───────────
    if (e.key === 'Backspace' && start === end) {
      const charBefore = value[start - 1];
      const charAfter  = value[start];
      if (charBefore && PAIRS[charBefore] && PAIRS[charBefore] === charAfter) {
        e.preventDefault();
        const next = value.substring(0, start - 1) + value.substring(start + 1);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start - 1;
        });
      }
      return;
    }

    // ── Auto-close brackets / quotes ─────────────────────────────────────────
    const closing = PAIRS[e.key];
    if (closing) {
      e.preventDefault();
      const selected = value.substring(start, end);

      if (selected.length > 0) {
        // Wrap selected text in the pair
        const next = value.substring(0, start) + e.key + selected + closing + value.substring(end);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = start + 1;
          ta.selectionEnd   = end + 1;
        });
      } else {
        // Insert pair and place cursor inside
        const next = value.substring(0, start) + e.key + closing + value.substring(end);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 1;
        });
      }
      return;
    }

    // ── Skip over closing char if it's already there ─────────────────────────
    if (CLOSING.has(e.key) && value[start] === e.key && start === end) {
      e.preventDefault();
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 1;
      });
    }
  }, [value, onChange]);

  const lineCount = (value.match(/\n/g) || []).length + 1;

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      ...(fillHeight ? { flex: 1, minHeight: 0 } : {}),
    }}>
      {/* Placeholder colour — can't be set via inline style */}
      <style>{`.elevra-editor::placeholder { color: #334155; font-style: italic; }`}</style>
      {/* ── Header bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#1e293b',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code2 size={15} style={{ color: '#60a5fa' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '.04em' }}>
            CODE EDITOR
          </span>
        </div>

        {/* Language selector */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            style={{
              appearance: 'none',
              background: 'rgba(255,255,255,.07)',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 6,
              padding: '4px 28px 4px 10px',
              fontSize: 12,
              fontWeight: 600,
              color: '#e2e8f0',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l} style={{ background: '#1e293b' }}>{l}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, color: '#64748b', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ── Editor body: line numbers + textarea ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: fillHeight ? 0 : 260, maxHeight: fillHeight ? 'none' : 400, overflow: 'hidden' }}>
        {/* Line numbers */}
        <div
          aria-hidden
          style={{
            padding: '14px 10px 14px 0',
            minWidth: 44,
            background: '#0f172a',
            borderRight: '1px solid rgba(255,255,255,.05)',
            textAlign: 'right',
            userSelect: 'none',
            overflowY: 'hidden',
            flexShrink: 0,
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} style={{ fontSize: 12, lineHeight: '21px', color: '#334155', paddingRight: 8 }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="elevra-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder={`// ${language} — write your solution here\n// Tip: brackets & quotes auto-close, Tab = 4 spaces`}
          style={{
            flex: 1,
            padding: '14px 16px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: '#e2e8f0',
            fontSize: 13,
            lineHeight: '21px',
            fontFamily: 'inherit',
            overflowY: 'auto',
          }}
        />
      </div>

      {/* ── Footer: char count ── */}
      <div style={{
        padding: '6px 16px',
        background: '#1e293b',
        borderTop: '1px solid rgba(255,255,255,.05)',
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: '#475569' }}>
          {lineCount} line{lineCount !== 1 ? 's' : ''} · {value.length} chars
        </span>
      </div>
    </div>
  );
}
