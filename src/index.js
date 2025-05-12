document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('startBtn');
    if (!btn) return;
  
    btn.addEventListener('click', () => {
      const studentId = document.getElementById('studentId').value.trim();
      const studentName = document.getElementById('studentName').value.trim();
      const currentTime = new Date().toLocaleString();
  
      if (!studentId || !studentName) {
        alert('학번과 이름을 모두 입력해주세요.');
        return;
      }
  
      localStorage.setItem('studentId', studentId);
      localStorage.setItem('studentName', studentName);
      localStorage.setItem('startTime', currentTime);
  
      const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeN2JCNj5pzz0r3TwRagOtK6oSCIZQoEYsCJF_crbmykdJkyg/formResponse';
      const formData = new FormData();
      formData.append('entry.1271583286', studentId);
      formData.append('entry.430525333', studentName);
      formData.append('entry.1017432853', currentTime);
  
      fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      }).finally(() => {
        window.location.href = 'page1.html'; // 상대경로
      });
    });
  });
  