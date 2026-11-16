import React from 'react';
import { Sparkles, Terminal } from 'lucide-react';

interface ChatMessageReviewProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Xử lý chuỗi văn bản inline: chuyển **in đậm**, *in nghiêng*, `code`, số tiền, link
 * thành các phần tử React trực quan, loại bỏ hoàn toàn cú pháp markdown thô.
 */
function renderFormattedInline(text: string): React.ReactNode {
  if (!text) return null;

  // Regex nhận diện các token:
  // 1: Code `...`
  // 2: Bold **...** hoặc __...__
  // 3: Italic *...* hoặc _..._
  // 4: Link [text](url)
  // 5: Tiền tệ VND (ví dụ: 5.600.000 ₫, 120.000đ, 3.000.000 VND)
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\)|\b\d{1,3}(?:\.\d{3})+(?:\s*(?:₫|đ|VND|VNĐ))\b)/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. Inline code: `...`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 bg-slate-100 text-emerald-700 rounded font-mono text-[10.5px] border border-slate-200 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 2. Bold text: **...** hoặc __...__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={index} className="font-bold text-slate-900 tracking-tight">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // 3. Italic text: *...* hoặc _..._
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }

    // 4. Link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 hover:text-emerald-700 underline font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // 5. Tiền tệ (VND) nổi bật
    const currencyMatch = part.match(/^\b\d{1,3}(?:\.\d{3})+(?:\s*(?:₫|đ|VND|VNĐ))\b$/);
    if (currencyMatch) {
      return (
        <span key={index} className="font-bold text-emerald-700 bg-emerald-50/80 px-1 py-0.5 rounded text-[11px]">
          {part}
        </span>
      );
    }

    // Xóa bỏ các ký tự dấu sao hoặc thăng đơn độc nếu còn sót lại do stream chưa xong
    const sanitizedText = part.replace(/^(\*{1,2}|_{1,2})|(\*{1,2}|_{1,2})$/g, '');
    return <React.Fragment key={index}>{sanitizedText}</React.Fragment>;
  });
}

/**
 * Parser khối nội dung hiển thị dạng "Review":
 * - Tiêu đề (Headings) hiển thị to, có icon, gạch chân nhẹ
 * - Bảng biểu (Markdown tables) parse thành thẻ <table> chuẩn đẹp
 * - Danh sách gạch đầu dòng / số thứ tự hiển thị bằng icon và badge
 * - Khối trích dẫn (Blockquote) hiển thị khung màu xanh emerald
 * - Khối mã code (Codeblocks) hiển thị khung terminal tối màu
 * - Không còn bất kỳ ký tự thô như **, ###, ---, |---| nào.
 */
export const ChatMessageReview: React.FC<ChatMessageReviewProps> = ({ content, isStreaming }) => {
  if (!content) {
    return isStreaming ? (
      <span className="inline-block w-1.5 h-3.5 bg-emerald-600 animate-pulse ml-1 rounded-xs" />
    ) : null;
  }

  // Tiền xử lý: nếu đang streaming mà thẻ ** hoặc ` chưa đóng, đóng tạm thời để tránh lộ ký tự thô
  let cleanContent = content;
  if (isStreaming) {
    const boldCount = (cleanContent.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) cleanContent += '**';
    const codeCount = (cleanContent.match(/`/g) || []).length;
    if (codeCount % 2 !== 0) cleanContent += '`';
  }

  const lines = cleanContent.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Dòng trống
    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Khối Codeblock: ```lang ... ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++; // Bỏ qua dòng đóng ```
      }
      elements.push(
        <div
          key={`code-${i}`}
          className="my-2 rounded-xl bg-slate-900 text-slate-100 p-3 font-mono text-[11px] overflow-x-auto shadow-sm border border-slate-800"
        >
          {lang && (
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 pb-1 border-b border-slate-800 uppercase font-semibold tracking-wider">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-emerald-400" />
                {lang}
              </span>
            </div>
          )}
          <pre className="whitespace-pre leading-relaxed text-slate-200">{codeLines.join('\n')}</pre>
        </div>
      );
      continue;
    }

    // 2. Bảng biểu Markdown Table (Dòng chứa dấu |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      // Tách hàng header và hàng data
      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

        // Kiểm tra xem dòng thứ 2 có phải là divider |---|---| không
        const isDivider = /^\|?(\s*:?-+:?\s*\|)+\s*$/.test(tableLines[1]);
        const dataRows = (isDivider ? tableLines.slice(2) : tableLines.slice(1)).map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

        elements.push(
          <div
            key={`table-${i}`}
            className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white"
          >
            <table className="w-full text-[11px] border-collapse text-left">
              <thead className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  {headerCells.map((h, hIdx) => (
                    <th key={hIdx} className="px-3 py-2">
                      {renderFormattedInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                        {renderFormattedInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 3. Tiêu đề: #, ##, ###, ####
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];

      if (level <= 2) {
        elements.push(
          <div
            key={`h-${i}`}
            className="font-extrabold text-slate-900 text-[13px] mt-3 mb-1.5 pb-1 border-b border-emerald-200/70 flex items-center gap-1.5 text-emerald-800"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{renderFormattedInline(headingText)}</span>
          </div>
        );
      } else {
        elements.push(
          <div
            key={`h-${i}`}
            className="font-bold text-slate-900 text-xs mt-2 mb-1 flex items-center gap-1.5 text-emerald-700"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{renderFormattedInline(headingText)}</span>
          </div>
        );
      }
      i++;
      continue;
    }

    // 4. Đường phân cách (Divider): --- hoặc *** hoặc ___
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(<hr key={`hr-${i}`} className="border-t border-slate-200/90 my-2.5" />);
      i++;
      continue;
    }

    // 5. Khối trích dẫn (Blockquote): > ...
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <div
          key={`quote-${i}`}
          className="border-l-3 border-emerald-500 bg-emerald-50/70 pl-3 py-1.5 my-2 rounded-r-xl text-slate-700 italic text-[11px] leading-relaxed shadow-2xs"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx}>{renderFormattedInline(ql)}</p>
          ))}
        </div>
      );
      continue;
    }

    // 5.1 Tiêu đề chuyên mục ghim (📌 ...)
    if (trimmed.startsWith('📌')) {
      elements.push(
        <div
          key={`pin-${i}`}
          className="font-bold text-emerald-800 text-xs mt-2.5 mb-1 pb-1 border-b border-emerald-200/60 flex items-center gap-1.5 tracking-tight"
        >
          <span className="text-sm shrink-0">📌</span>
          <span>{renderFormattedInline(trimmed.replace(/^📌\s*/, ''))}</span>
        </div>
      );
      i++;
      continue;
    }

    // 5.2 Lời khuyên / Mẹo (💡 ...)
    if (trimmed.startsWith('💡')) {
      elements.push(
        <div
          key={`tip-${i}`}
          className="my-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed flex items-start gap-1.5 shadow-2xs"
        >
          <span className="text-sm shrink-0 leading-none">💡</span>
          <div className="flex-1">{renderFormattedInline(trimmed.replace(/^💡\s*/, ''))}</div>
        </div>
      );
      i++;
      continue;
    }

    // 6. Danh sách không thứ tự (Bullet List): - hoặc * hoặc + hoặc •
    if (/^[\*\-\+•]\s+(.*)$/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[\*\-\+•]\s+(.*)$/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[\*\-\+•]\s+/, '');
        listItems.push(itemText);
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-1.5 pl-0.5">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="flex items-start gap-2 leading-relaxed text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className="flex-1">{renderFormattedInline(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 7. Danh sách có thứ tự (Numbered List): 1. hoặc 1)
    if (/^(\d+)[\.\)]\s+(.*)$/.test(trimmed)) {
      const numberedItems: { num: string; text: string }[] = [];
      while (i < lines.length && /^(\d+)[\.\)]\s+(.*)$/.test(lines[i].trim())) {
        const m = lines[i].trim().match(/^(\d+)[\.\)]\s+(.*)$/);
        if (m) {
          numberedItems.push({ num: m[1], text: m[2] });
        }
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1.5 my-1.5 pl-0.5">
          {numberedItems.map((item, nIdx) => (
            <li key={nIdx} className="flex items-start gap-2 leading-relaxed text-slate-800">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <div className="flex-1">{renderFormattedInline(item.text)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 8. Đoạn văn bản thông thường (Paragraph)
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-slate-800">
        {renderFormattedInline(line)}
      </p>
    );
    i++;
  }

  return (
    <div className="space-y-1 text-slate-800 break-words leading-relaxed">
      {elements}
      {isStreaming && (
        <span className="inline-block w-1.5 h-3.5 bg-emerald-600 animate-pulse ml-1 rounded-xs align-middle" />
      )}
    </div>
  );
};
