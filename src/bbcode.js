import { BBCode, BBMode, BBType } from 'nbbcjs';

const bbcode = new BBCode();

bbcode.addRule('align', {
  mode: BBMode.ENHANCED,
  class: 'block',
  template: '<div style="text-align:{$_default/tw}">{$_content}</div>',
});

bbcode.addRule('hr', {
  mode: BBMode.SIMPLE,
  simple_start: '<hr />',
  simple_end: '',
});

bbcode.addRule('font', {
  mode: BBMode.ENHANCED,
  class: 'columns',
  template: '<span style="font-family:{$_default/tw}">{$_content}</span>',
});

bbcode.addRule('backcolor', {
  mode: BBMode.ENHANCED,
  class: 'columns',
  template: '<span style="background-color:{$_default/tw}">{$_content}</span>',
});

bbcode.addRule('quote', {
  mode: BBMode.SIMPLE,
  simple_start: '<blockquote>',
  simple_end: '</blockquote>',
});

bbcode.addRule('code', {
  mode: BBMode.ENHANCED,
  template: '<pre><code>{$_content/v}</code></pre>',
  class: 'code',
  content: BBType.VERBATIM,
  before_tag: 'sns',
  after_tag: 'sn',
  before_endtag: 'sn',
  after_endtag: 'sns',
});

bbcode.addRule('attach', {
  mode: BBMode.ENHANCED,
  class: 'block',
  template: '<div class="attachment" data-id="{$_content}">Loading attachment...</div>'
});

export { bbcode as BBCode };
export const parse = (text) => bbcode.parse(text);
