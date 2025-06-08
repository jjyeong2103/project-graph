document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submitBtn').addEventListener('click', () => {
    const good = document.getElementById('goodPoint').value.trim();
    const strange = document.getElementById('strangePoint').value.trim();
    const improve = document.getElementById('improvePoint').value.trim();


    if (!good || !strange || !improve) {
    alert('모든 항목을 작성해 주세요.');
    return;
    }

    // 구글 폼 입력
       const studentId = localStorage.getItem('studentId') || '';
       const studentName = localStorage.getItem('studentName') || '';
       const startTime = localStorage.getItem('startTime') || '';

       const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeN2JCNj5pzz0r3TwRagOtK6oSCIZQoEYsCJF_crbmykdJkyg/formResponse';
       const formData = new FormData();

       formData.append('entry.1271583286', studentId);
       formData.append('entry.430525333', studentName);
       formData.append('entry.1017432853', startTime);
       formData.append('entry.753650793', good);         
       formData.append('entry.67195128', strange);
       formData.append('entry.947682136', improve);
          
    fetch(formUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    });

    document.getElementById('confirmation').classList.remove('hidden');
    const surveyBtn = document.getElementById('surveyBtn');
    surveyBtn.classList.remove('bg-gray-400', 'pointer-events-none'); // 회색 제거 + 클릭 불가 제거
    surveyBtn.classList.add('bg-green-500', 'hover:bg-green-600');     // 초록색 추가 + 호버 효과 추가

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.classList.add('bg-gray-400');
  });
});
