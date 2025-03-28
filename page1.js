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
    uploadedData = data; // 전역 변수에 저장

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

  let points = [];
  let axisMax = { x: 10, y: 10 };
  let uploadedData = [];
  
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');
  const padding = 60;
  
  // 고해상도 대응
  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
  
  document.getElementById('csvFileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      const rows = text.trim().split('\n').map(row => row.split(','));
      uploadedData = rows;
      renderTable(rows);
  
      // x/y 최대값 계산
      const numericRows = rows.slice(1).map(row => row.map(Number));
      const xValues = numericRows.map(row => row[0]);
      const yValues = numericRows.map(row => row[1]);
      const maxX = Math.max(...xValues);
      const maxY = Math.max(...yValues);
      axisMax = {
        x: Math.ceil(maxX * 1.1),
        y: Math.ceil(maxY * 1.1),
      };
  
      setupCanvas();
      drawGrid();
    };
    reader.readAsText(file);
  });
  
  
  function drawGrid() {
    const usableWidth = canvas.width / window.devicePixelRatio - padding * 2;
    const usableHeight = canvas.height / window.devicePixelRatio - padding * 2;
  
    const xUnit = usableWidth / axisMax.x;
    const yUnit = usableHeight / axisMax.y;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    ctx.save();
    ctx.translate(padding, canvas.height / window.devicePixelRatio - padding);
    ctx.scale(1, -1);
  
    // grid lines
    ctx.strokeStyle = '#eee';
    for (let x = 0; x <= axisMax.x; x++) {
      ctx.beginPath();
      ctx.moveTo(x * xUnit, 0);
      ctx.lineTo(x * xUnit, usableHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= axisMax.y; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * yUnit);
      ctx.lineTo(usableWidth, y * yUnit);
      ctx.stroke();
    }
  
    // axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(usableWidth + 10, 0);
    ctx.stroke();
  
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, usableHeight + 10);
    ctx.stroke();
  
    // arrowheads
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(usableWidth + 10, -4);
    ctx.lineTo(usableWidth + 18, 0);
    ctx.lineTo(usableWidth + 10, 4);
    ctx.fill();
  
    ctx.beginPath();
    ctx.moveTo(-4, usableHeight + 10);
    ctx.lineTo(0, usableHeight + 18);
    ctx.lineTo(4, usableHeight + 10);
    ctx.fill();
  
    // 숫자 라벨
    ctx.scale(1, -1);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#444';
    for (let x = 1; x <= axisMax.x; x++) {
      ctx.fillText(x, x * xUnit - 4, 12);
    }
    for (let y = 1; y <= axisMax.y; y++) {
      ctx.fillText(y, -20, -y * yUnit + 4);
    }
  
    ctx.scale(1, -1);
    // 점 찍기
    ctx.fillStyle = 'red';
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * xUnit, p.y * yUnit, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  
    ctx.restore();
  }
  
  function getCanvasCoords(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left - padding;
    const y = canvas.height / window.devicePixelRatio - (evt.clientY - rect.top) - padding;
  
    const unitX = (canvas.width / window.devicePixelRatio - padding * 2) / axisMax.x;
    const unitY = (canvas.height / window.devicePixelRatio - padding * 2) / axisMax.y;
  
    return {
      x: Math.round(x / unitX),
      y: Math.round(y / unitY)
    };
  }
  
  canvas.addEventListener('click', (e) => {
    const point = getCanvasCoords(e);
    const exists = points.findIndex(p => p.x === point.x && p.y === point.y);
    if (exists >= 0) {
      points.splice(exists, 1);
    } else {
      points.push(point);
    }
    drawGrid();
  });
  