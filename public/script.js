;'use strict';

(() => {

if (!window.CURRENT_ATTACH_LIST || window.CURRENT_ATTACH_LIST.length <= 0) return;

const attachList = parseDuplicateAttach(window.CURRENT_ATTACH_LIST);
const attachDOMS = document.querySelectorAll('.attachment[data-id]');

for (const attachDOM of attachDOMS) {
  const attachId = parseInt(attachDOM.dataset.id);
  const attachInfo = attachList.find((e) => e.aid === attachId);

  if (!attachInfo) {
    attachDOM.classList.add('failed');
    attachDOM.innerHTML = 'Cannot load attachment :(';
    continue;
  }

  parseAttach(attachDOM, attachInfo);
}

for (const attachInfo of attachList) {
  if (attachInfo._parsed) continue;

  const threadDOM = document.querySelector(`.thread-detail-post[data-pid="${attachInfo.pid}"]`);
  const contentDOM = threadDOM.querySelector('.thread-detail-post-content-text-parsed');
  const attachDOM = document.createElement('div');

  attachDOM.dataset.id = attachInfo.aid;
  attachDOM.classList.add('attachment');
  parseAttach(attachDOM, attachInfo, true);

  contentDOM.appendChild(attachDOM);
}

})();

function parseDuplicateAttach(array) {
  const result = [];
  for (const item of array) {
    if (result.find((e) => e.aid === item.aid)) continue;
    else result.push(item);
  }
  return result;
}

function storageConvert(byte) {
  const units = [ 'KB', 'MB', 'GB' ];
  let result = byte;
  let resultText = `${result}B`;

  for (let i = 0; i < units.length; i++) {
    result = result / 1024;
    if (result < 1) break;
    resultText = `${Math.round(result * 1000) / 1000}${units[i]}`;
  }

  return resultText;
}

function parseAttach(DOM, attachInfo, imgWithUrl = false) {
  const { detail: attachDetail } = attachInfo;
  DOM.innerHTML = '';

  if (attachDetail.isimage !== 0) {
    const imgDOM = document.createElement('img');
    
    DOM.classList.add('image');

    imgDOM.src = attachDetail.attachment;
    imgDOM.title =imgDOM.alt = (attachDetail.description != '' ? attachDetail.description : attachDetail.filename);
    if (attachDetail.width !== 0) imgDOM.style.maxWidth = `${attachDetail.width}px`;
    if (attachDetail.height !== 0) imgDOM.style.maxHeight = `${attachDetail.height}px`;

    if (imgWithUrl) {
      const url = document.createElement('a');

      url.href = attachDetail.attachment;
      url.download = attachDetail.filename;
      url.target = '_blank';

      url.appendChild(imgDOM);
      DOM.appendChild(url);
    } else {
      DOM.appendChild(imgDOM);
    }
  } else {
    DOM.classList.add('file');
    DOM.innerHTML = `<p>附件：<a href="${attachDetail.attachment}" download="${attachDetail.filename}" target="_blank">${attachDetail.filename}</a><span class="pipe"> | </span>文件大小：${storageConvert(attachDetail.filesize)}</p>
      <p>ID：${attachDetail.aid}<span class="pipe"> | </span>上传日期：${(new Date(attachDetail.dateline * 1000)).toLocaleString()}<span class="pipe"> | </span>下载量：${attachInfo.downloads}</p>`;
  }

  DOM.dataset.attached = true;
  attachInfo._parsed = true;
}

function toggleShowBBCode(postnum, checkbox) {
  const PostDOM = document.querySelector(`#post${postnum}`);
  if (!PostDOM) return;

  const ParsedDOM = PostDOM.querySelector('.thread-detail-post-content-text-parsed');
  const RawDOM = PostDOM.querySelector('.thread-detail-post-content-text-raw');
  if (!ParsedDOM || !RawDOM) return;

  if (checkbox.checked) {
    ParsedDOM.classList.add('hidden');
    RawDOM.classList.remove('hidden');
  } else {
    ParsedDOM.classList.remove('hidden');
    RawDOM.classList.add('hidden');
  }
}
