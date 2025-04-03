import Swal from 'sweetalert2';

let uploadedData = []; 
let xAxisLabel = 'x';
let yAxisLabel = 'y';
let points = [];

// 페이지 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
  let maxPoints = Infinity;
  let axisMax = { x: 10, y: 10 };

  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');
  const padding = 60;

  // 캔버스 설정 (DPR 및 리사이징 대응)
  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = Math.max(canvas.clientHeight, 300);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', () => {
    setupCanvas();
    drawGrid();
  });

  // CSV 파일 업로드 시 처리
  document.getElementById('csvFileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const rows = e.target.result.trim().split('\n').map(row => row.split(','));
      uploadedData = rows;
      renderTable(rows);

      const header = rows[0];
      xAxisLabel = header[0] || 'x';
      yAxisLabel = header[1] || 'y';

      const numericData = rows.slice(1)
        .filter(row => row[0].trim() && row[1].trim())
        .map(row => row.map(Number));

      const xValues = numericData.map(row => row[0]);
      const yValues = numericData.map(row => row[1]);

      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);
      const yMin = Math.floor(minY - 5);
      const yMax = Math.ceil(maxY + 5);

      axisMax = { x: xValues.length, y: yMax - yMin };
      window.yStart = yMin;

      maxPoints = numericData.length;

      setupCanvas();
      drawGrid();
    };
    reader.readAsText(file);
  });

  // CSV 데이터 테이블 렌더링
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

  // 보기 좋은 y축 눈금 간격 계산
  function getNiceTickInterval(range) {
    const rough = range / 8;
    const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
    const fraction = rough / pow10;
    if (fraction <= 1) return 1 * pow10;
    if (fraction <= 2) return 2 * pow10;
    if (fraction <= 5) return 5 * pow10;
    return 10 * pow10;
  }

  // 화살표 그리기 함수
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

  // 좌표평면 및 점 그리기
  function drawGrid() {
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    const numericData = uploadedData.slice(1).map(row => row.map(Number));
    const xValues = numericData.map(row => row[0]);
    const uniqueX = [...new Set(xValues)].sort((a, b) => a - b);
    const xStep = usableWidth / (uniqueX.length + 1);
    const yUnit = usableHeight / axisMax.y;
    const tickStepY = getNiceTickInterval(axisMax.y);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(padding + 5, height - padding);
    ctx.scale(1, -1);

    // 배경 격자
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    uniqueX.forEach((_, i) => {
      const x = (i + 1) * xStep;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, usableHeight);
      ctx.stroke();
    });

    for (let y = 0; y <= axisMax.y; y += tickStepY) {
      ctx.beginPath();
      ctx.moveTo(0, y * yUnit);
      ctx.lineTo(usableWidth, y * yUnit);
      ctx.stroke();
    }

    // 축과 점
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    drawArrow(0, 0, usableWidth + 10, 0);
    drawArrow(0, 0, 0, usableHeight + 10);

    ctx.fillStyle = 'red';
    points.forEach(p => {
      const xIndex = uniqueX.indexOf(p.x);
      if (xIndex === -1) return;
      const x = (xIndex + 1) * xStep;
      const y = (p.y - window.yStart) * yUnit;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // 눈금 및 축 라벨
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
      const yLabel = y + window.yStart;
      const yPos = height - padding - y * yUnit;
      ctx.fillText(yLabel, padding - 10, yPos);
    }

    ctx.textAlign = 'center';
    ctx.fillText(xAxisLabel, padding + usableWidth / 2, height - padding + 50);
    ctx.save();
    ctx.translate(padding - 50, height - padding - usableHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();
  }

  // 캔버스 클릭 좌표 계산
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
    const y = graphY / yUnit + window.yStart;
    return { x, y };
  }

  // 가장 가까운 CSV 좌표로 스냅
  function snapToNearestCSV(point) {
    const dataPoints = uploadedData.slice(1).map(row => ({ x: Number(row[0]), y: Number(row[1]) }));
    let nearest = null;
    let minDist = Infinity;
    dataPoints.forEach(p => {
      const dist = Math.abs(p.x - point.x) + Math.abs(p.y - point.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    });
    return minDist <= 3 ? nearest : point;
  }

  // 캔버스 클릭 시 점 추가/삭제
  canvas.addEventListener('click', (e) => {
    const point = snapToNearestCSV(getCanvasCoords(e));
    if (!point) return;

    const exists = points.findIndex(p => Math.hypot(p.x - point.x, p.y - point.y) < 0.1);
    if (exists >= 0) {
      points.splice(exists, 1);
      drawGrid();
      return;
    }

    if (points.some(p => Math.hypot(p.x - point.x, p.y - point.y) < 1)) return;

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

  // 점 초기화 버튼
  document.getElementById('clearPointsBtn').addEventListener('click', () => {
    points.length = 0;
    drawGrid();
  });

  // 피드백 확인 버튼
  document.getElementById('feedbackBtn').addEventListener('click', () => {
    const numericData = uploadedData.slice(1).map(row => ({ x: Number(row[0]), y: Number(row[1]) }));
    let correctCount = points.filter(p => numericData.some(d => Math.abs(d.x - p.x) < 0.1 && Math.abs(d.y - p.y) < 0.1)).length;

    const allCorrect = correctCount === numericData.length;
    Swal.fire({
      icon: allCorrect ? 'success' : 'info',
      title: `총 ${numericData.length}개의 점 중 ${correctCount}개가 정확해요.`,
      text: allCorrect ? '모든 점이 정확하게 찍혔어요!' : '다시 확인해보세요.',
      confirmButtonText: '확인'
    });

    const nextBtn = document.getElementById('checkGraphBtn');
    nextBtn.disabled = !allCorrect;
    nextBtn.classList.toggle('bg-green-500', allCorrect);
    nextBtn.classList.toggle('hover:bg-green-600', allCorrect);
    nextBtn.classList.toggle('cursor-pointer', allCorrect);
    nextBtn.classList.toggle('bg-gray-400', !allCorrect);
    nextBtn.classList.toggle('opacity-50', !allCorrect);
    nextBtn.classList.toggle('cursor-not-allowed', !allCorrect);
  });

  // 다음 페이지로 이동 (로컬 저장 포함)
  document.getElementById('checkGraphBtn').addEventListener('click', () => {
    const numericData = uploadedData.slice(1).map(row => row.map(Number));
    const xValues = numericData.map(row => row[0]);
    const yValues = numericData.map(row => row[1]);
    const uniqueX = [...new Set(xValues)].sort((a, b) => a - b);
    const axisMax = {
      x: uniqueX.length,
      y: Math.ceil(Math.max(...yValues) * 1.1),
    };

    const originalPoints = numericData.map(row => ({ x: row[0], y: row[1] }));

    localStorage.setItem('graphData', JSON.stringify({
      points: originalPoints,
      uniqueX,
      axisMax,
      xAxisLabel,
      yAxisLabel
    }));

    Swal.fire({
      icon: 'success',
      title: '그래프 그리기 완료!',
      confirmButtonText: '계속하기'
    }).then(() => {
      window.location.href = '/page2.html';
    });
  });
});