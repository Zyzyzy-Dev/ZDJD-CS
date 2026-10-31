// 纯判断逻辑（不碰酒馆），方便单独测试。

/** "</content>,<talk>" → ['</content>', '<talk>']，空 → [] */
export function parseAnchors(raw) {
    return String(raw || '').split(',').map(s => s.trim()).filter(Boolean);
}

/** 标签形状的起始标记 → 对应的一对标签；不是标签形状 → null */
function tagPairOf(anchor) {
    const close = /^<\/\s*([A-Za-z][\w:-]*)\s*>$/.exec(anchor);
    if (close) return { open: `<${close[1]}>`, close: `</${close[1]}>` };
    const open = /^<([A-Za-z][\w:-]*)\s*>$/.exec(anchor);
    if (open) return { open: `<${open[1]}>`, close: `</${open[1]}>` };
    return null;
}

/** 找到完整的 <x>…</x>，返回闭标签结束的位置；没有完整一对 → -1 */
function pairEnd(text, pair) {
    let from = 0;
    while (true) {
        const oi = text.indexOf(pair.open, from);
        if (oi < 0) return -1;
        const ci = text.indexOf(pair.close, oi + pair.open.length);
        if (ci < 0) return -1;
        const oi2 = text.indexOf(pair.open, oi + pair.open.length);
        if (oi2 >= 0 && oi2 < ci) { from = oi2; continue; } // 前一个开标签没闭合，从后一个重来
        return ci + pair.close.length;
    }
}

/**
 * 是否该截断。
 * @param {string} text      目前已生成的全文
 * @param {string} marker    截断标记，如 <mutter>
 * @param {string} anchorsRaw 起始标记，逗号分隔；留空 = 全文检测
 * @param {boolean} needPair 起始标记是标签时，要求先有完整的一对标签
 * @returns {number} 截断标记在原文中的位置，-1 = 不截断
 */
export function findStopAt(text, marker, anchorsRaw, needPair) {
    const t = String(text || '');
    if (!marker) return -1;
    const anchors = parseAnchors(anchorsRaw);
    if (!anchors.length) return t.indexOf(marker);

    let best = -1;
    for (const a of anchors) {
        const pair = needPair ? tagPairOf(a) : null;
        let armPos;
        if (pair) {
            armPos = pairEnd(t, pair);
        } else {
            const ai = t.indexOf(a);
            armPos = ai < 0 ? -1 : ai + a.length;
        }
        if (armPos < 0) continue;
        const hit = t.indexOf(marker, armPos);
        if (hit >= 0 && (best < 0 || hit < best)) best = hit;
    }
    return best;
}
