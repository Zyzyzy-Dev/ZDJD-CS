import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced, eventSource, event_types, stopGeneration } from '../../../../script.js';
import { findStopAt } from './logic.js';

const NAME = 'mutter-auto-stop';
const LOG = '[碎碎念自动截断]';
const DEFAULTS = {
    enabled: true,
    marker: '<mutter>',
    anchors: '</content>,<talk>',
    needPair: true,
};

extension_settings[NAME] = Object.assign({}, DEFAULTS, extension_settings[NAME]);
const settings = extension_settings[NAME];

let triggered = false;

function onToken(text) {
    if (!settings.enabled || triggered || !text) return;
    const at = findStopAt(text, settings.marker, settings.anchors, settings.needPair);
    if (at < 0) return;
    triggered = true;
    console.log(`${LOG} 在第 ${at} 个字检测到 ${settings.marker} → 停止生成`);
    try { stopGeneration(); } catch (e) { console.warn(`${LOG} 停止生成失败:`, e); }
}

function reset() { triggered = false; }

eventSource.on(event_types.GENERATION_STARTED, reset);
eventSource.on(event_types.GENERATION_ENDED, reset);
eventSource.on(event_types.STREAM_TOKEN_RECEIVED, onToken);

function mountSettings() {
    const html = `
<div class="mutter-auto-stop-settings">
  <div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>✂️ 碎碎念自动截断</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>
    <div class="inline-drawer-content">
      <label class="checkbox_label"><input id="mas_enabled" type="checkbox"> 启用（需开启流式输出）</label>
      <label for="mas_marker">截断标记</label>
      <input id="mas_marker" class="text_pole" type="text" placeholder="<mutter>">
      <label for="mas_anchors">起始标记（出现它之后才检测；多个用英文逗号分隔；留空＝全文检测）</label>
      <input id="mas_anchors" class="text_pole" type="text" placeholder="</content>,<talk>">
      <label class="checkbox_label"><input id="mas_needPair" type="checkbox"> 必须先有完整的一对标签（如 &lt;content&gt;…&lt;/content&gt;）才截断，防误截</label>
    </div>
  </div>
</div>`;
    $('#extensions_settings2').append(html);
    $('#mas_enabled').prop('checked', settings.enabled).on('change', function () { settings.enabled = this.checked; saveSettingsDebounced(); });
    $('#mas_needPair').prop('checked', settings.needPair).on('change', function () { settings.needPair = this.checked; saveSettingsDebounced(); });
    $('#mas_marker').val(settings.marker).on('input', function () { settings.marker = this.value; saveSettingsDebounced(); });
    $('#mas_anchors').val(settings.anchors).on('input', function () { settings.anchors = this.value; saveSettingsDebounced(); });
}

jQuery(() => { mountSettings(); console.log(`${LOG} 已加载`); });
