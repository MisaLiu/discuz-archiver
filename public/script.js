
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
