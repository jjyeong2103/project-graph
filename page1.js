import Swal from 'sweetalert2';

let uploadedData = []; 
let xAxisLabel = 'x';
let yAxisLabel = 'y';


document.addEventListener('DOMContentLoaded', () => {
  let points = [];
  let maxPoints = Infinity;
  let axisMax = { x: 10, y: 10 };
  
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');
  const padding = 60;

  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const minHeight = 300;
    const adjustedHeight = Math.max(height, minHeight);
    canvas.width = width * dpr;
    canvas.height = adjustedHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', () => {
    setupCanvas();
    drawGrid();
  });

  document.getElementById('csvFileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      const rows = text.trim().split('\n').map(row => row.split(','));
      uploadedData = rows;
      renderTable(rows);

      const header = rows[0];
      xAxisLabel = header[0] || 'x';
      yAxisLabel = header[1] || 'y';

      const numericData = rows
        .slice(1)
        .filter(row => row[0].trim() !== '' && row[1].trim() !== '')
        .map(row => row.map(Number));

      const xValues = numericData.map(row => row[0]);
      const yValues = numericData.map(row => row[1]);

      const maxY = Math.max(...yValues);
      axisMax = {
        x: xValues.length,
        y: Math.ceil(maxY * 1.1),
      };

      maxPoints = numericData.length;

      setupCanvas();
      drawGrid();
    };
    reader.readAsText(file);
  });

  function renderTable(data) {
    const tableBody = document.getElementById('csvTableBody');
    tableBody.innerHTML = '';
    for (let i = 0; i < data.length && i < 50; i++) {
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

  function drawArrow(fromX, fromY, toX, toY) {
    const headLength = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  function drawGrid() {
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    const numericData = uploadedData.slice(1).map(row => row.map(Number));
    const xValues = numericData.map(row => row[0]);
    const yValues = numericData.map(row => row[1]);
    const uniqueX = [...new Set(xValues)].sort((a, b) => a - b);

    const xStep = usableWidth / (uniqueX.length + 1);
    const yUnit = usableHeight / axisMax.y;

    ctx.clearRect(0, 0, width, height);
    const tickStepY = Math.ceil(axisMax.y / 10);

    ctx.save();
    ctx.translate(padding +5, height - padding);
    ctx.scale(1, -1);

    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    uniqueX.forEach((_, i) => {
      const xPos = (i + 1) * xStep;
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, usableHeight);
      ctx.stroke();
    });

    for (let y = 0; y <= axisMax.y; y += tickStepY) {
      ctx.beginPath();
      ctx.moveTo(0, y * yUnit);
      ctx.lineTo(usableWidth, y * yUnit);
      ctx.stroke();
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    drawArrow(0, 0, usableWidth + 10, 0);
    drawArrow(0, 0, 0, usableHeight + 10);

    ctx.fillStyle = 'red';
    points.forEach(p => {
      const xIndex = uniqueX.indexOf(p.x);
      if (xIndex === -1) return;
      const x = (xIndex + 1) * xStep;
      const y = p.y * yUnit;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    uniqueX.forEach((xVal, i) => {
      const xPos = padding + (i + 1) * xStep;
      ctx.save();
      ctx.translate(xPos, height - padding + 20);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(xVal.toString(), 0, 0);
      ctx.restore();
    });

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = 0; y <= axisMax.y; y += tickStepY) {
      ctx.fillText(y, padding - 10, height - padding - y * yUnit);
    }

    ctx.textAlign = 'center';
    ctx.fillText(xAxisLabel, padding + usableWidth / 2, height - padding + 50);
    ctx.save();
    ctx.translate(padding - 50, height - padding - usableHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();
  }

  function getCanvasCoords(evt) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    const numericData = uploadedData.slice(1).map(row => row.map(Number));
    const xValues = numericData.map(row => row[0]);
    const uniqueX = [...new Set(xValues)].sort((a, b) => a - b);
    const xStep = usableWidth / (uniqueX.length + 1);
    const yUnit = usableHeight / axisMax.y;

    const offsetX = evt.clientX - rect.left;
    const offsetY = evt.clientY - rect.top;

    const graphX = offsetX - padding;
    const graphY = height - offsetY - padding;

    const xIndex = Math.round(graphX / xStep) - 1;
    const x = uniqueX[xIndex];
    const y = graphY / yUnit;

    return { x, y };
  }

  function snapToNearestCSV(point) {
    if (!uploadedData || uploadedData.length < 2) return point;
    const dataPoints = uploadedData.slice(1).map(row => ({ x: Number(row[0]), y: Number(row[1]) }));
    let nearest = null;
    let minDist = Infinity;
    dataPoints.forEach(p => {
      const dx = Math.abs(p.x - point.x);
      const dy = Math.abs(p.y - point.y);
      const dist = dx + dy;
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    });
    return minDist <= 1.5 ? nearest : point;
  }

  canvas.addEventListener('click', (e) => {
    const point = snapToNearestCSV(getCanvasCoords(e));

    const exists = points.findIndex(p => {
      const dx = p.x - point.x;
      const dy = p.y - point.y;
      return Math.hypot(dx, dy) < 0.1;
    });
    if (exists >= 0) {
      points.splice(exists, 1);
      drawGrid();
      return;
    }

    const tooClose = points.some(p => {
      const dx = p.x - point.x;
      const dy = p.y - point.y;
      return Math.hypot(dx, dy) < 3;
    });
    if (tooClose) return;

    if (points.length >= maxPoints) {
      Swal.fire({
        icon: "error",
        title: "이미 점을 모두 찍었어요",
        text: "점을 지우고 다시 찍거나, 피드백을 받아보세요.",
        confirmButtonText: "확인"
      });
      return;
    }

    points.push(point);
    drawGrid();
  });
});


document.getElementById('checkGraphBtn').addEventListener('click', () => {
  console.log('버튼 클릭됨');
  const numericData = uploadedData.slice(1).map(row => row.map(Number));
  const xValues = numericData.map(row => row[0]);
  const yValues = numericData.map(row => row[1]);
  const uniqueX = [...new Set(xValues)].sort((a, b) => a - b);
  const axisMax = {
    x: uniqueX.length,
    y: Math.ceil(Math.max(...yValues) * 1.1),
  };

  const originalPoints = numericData.map(row => ({ x: row[0], y: row[1] }));

  // ✅ 저장
  localStorage.setItem('graphData', JSON.stringify({
    points: originalPoints,
    uniqueX,
    axisMax,
    xAxisLabel,
    yAxisLabel
  }));

  console.log('저장 완료:', localStorage.getItem('graphData')); // 여기서 null이면 실패

  Swal.fire({
    icon: 'success',
    title: '그래프 데이터 저장 완료!',
    confirmButtonText: '계속하기'
  }).then(() => {
    window.location.href = '/page2.html';
  });
});
