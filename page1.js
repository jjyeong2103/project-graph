document.getElementById('csvFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const rows = text.trim().split('\n').map(row => row.split(','));
      renderTable(rows);
    };
    reader.readAsText(file);
  });
  
  function renderTable(data) {
    const tableBody = document.getElementById('csvTableBody');
    tableBody.innerHTML = ''; // 초기화
  
    const maxRows = 50;
    for (let i = 0; i < data.length && i < maxRows; i++) {
      const row = document.createElement('tr');
      row.className = i % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  
      data[i].forEach(cell => {
        const td = document.createElement('td');
        td.className = 'px-2 py-1';
        td.textContent = cell.trim();
        row.appendChild(td);
      });
  
      tableBody.appendChild(row);
    }
  }
  