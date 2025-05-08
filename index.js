document.getElementById('startBtn').addEventListener('click', () => {
  const studentId = document.getElementById('studentId').value.trim();
  const studentName = document.getElementById('studentName').value.trim();
  const currentTime = new Date().toLocaleString();

  if (!studentId || !studentName) {
    alert('학번과 이름을 모두 입력해주세요.');
    return;
  }

  // localStorage로 학번·이름·시작 시간 저장
  localStorage.setItem('studentId', studentId);
  localStorage.setItem('studentName', studentName);
  localStorage.setItem('startTime', currentTime);
  
  // Google Form 로그 전송
  const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeN2JCNj5pzz0r3TwRagOtK6oSCIZQoEYsCJF_crbmykdJkyg/formResponse';
  const formData = new FormData();
  formData.append('entry.1271583286', studentId);   // 학번 entry ID 
  formData.append('entry.430525333', studentName); // 이름 entry ID
  formData.append('entry.1017432853', currentTime); // 시간 entry ID

  fetch(formUrl, {
    method: 'POST',
    mode: 'no-cors',
    body: formData
  }).finally(() => {
    // 전송 완료 여부와 상관없이 page1.html로 이동
    window.location.href = '/page1.html';
  });
});
