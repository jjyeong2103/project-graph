import Swal from 'sweetalert2';

let selectedData = [];
let plottedPoints = [];
let canvas, ctx;
let xLabels = [];
let yMax = 0;
let tickStepY = 0;
let xAxisLabel = "x";
let yAxisLabel = "y";
let feedbackClickCount = 0;

// 초기화
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("graphCanvas");
  ctx = canvas.getContext("2d");

  renderDataList();
  document.getElementById("dataSelect").addEventListener("change", loadSelectedData);
  document.getElementById("checkGraphBtn").addEventListener("click", checkGraph);
  document.getElementById("clearPointsBtn").addEventListener("click", () => {
    plottedPoints = [];
    drawGraph();
  });
  document.getElementById("nextStepBtn").addEventListener("click", handleNextStep);
  canvas.addEventListener("click", handleCanvasClick);
});

// 미리 정의된 데이터
const predefinedData = [
  { name: "추의 개수에 따른 용수철의 길이", data: [ { x: "1", y: 4 }, { x: "2", y: 8 }, { x: "3", y: 12 }, { x: "4", y: 16 }, { x: "5", y: 20 } ] },
  { name: "모자 뜨기 꾸러미에 따른 모자의 개수", data: [ { x: "1", y: 2 }, { x: "2", y: 4 }, { x: "3", y: 6 }, { x: "4", y: 8 }, { x: "5", y: 10 } ] },
  { name: "지면의 높이에 따른 기온", data: [ { x: "0", y: 24 }, { x: "1", y: 18 }, { x: "2", y: 12 }, { x: "3", y: 6 }, { x: "4", y: 0 } ] },
  { name: "동영상 업로드 후 경과 일수에 따른 조회 수", data: [ { x: "1", y: 15 }, { x: "2", y: 30 }, { x: "3", y: 60 }, { x: "4", y: 85 }, { x: "5", y: 105 } ] },
  { name: "반려 식물의 키를 관찰하기 시작한 주차와 식물의 키", data: [ { x: "1", y: 2 }, { x: "2", y: 4 }, { x: "3", y: 6 }, { x: "4", y: 8 }, { x: "5", y: 10 } ] },
  { name: "음료수 캔 개수에 따른 이산화탄소 배출량", data: [ { x: "1", y: 100 }, { x: "2", y: 200 }, { x: "3", y: 300 }, { x: "4", y: 400 }, { x: "5", y: 500 } ] }
];

function renderDataList() {
  const select = document.getElementById("dataSelect");
  select.innerHTML = `<option value="">-- 데이터를 선택하세요 --</option>`;

  predefinedData.forEach((dataset, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = dataset.name;
    select.appendChild(option);
  });
}

function loadSelectedData() {
  const selectedIndex = parseInt(document.getElementById("dataSelect").value);
  if (isNaN(selectedIndex)) return;

  const selectedSet = predefinedData[selectedIndex];
  selectedData = selectedSet.data;
  xLabels = selectedData.map((d) => d.x);
  yMax = Math.ceil(Math.max(...selectedData.map((d) => d.y)) * 1.2);

  plottedPoints = [];
  feedbackClickCount = 0;
  drawGraph();
  showDataPreview();
}

function showDataPreview() {
  const preview = document.getElementById("dataPreview");
  if (!selectedData.length) return (preview.innerHTML = "");

  const rows = selectedData.map((d, i) => `
    <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
      <td class="px-4 py-2 border text-center">${d.x}</td>
      <td class="px-4 py-2 border text-center">${d.y}</td>
    </tr>`).join("");

  preview.innerHTML = `
    <table class="table-auto w-full border-collapse border border-gray-300 rounded shadow-sm overflow-hidden">
      <thead class="bg-gray-100 text-gray-700">
        <tr><th class="px-4 py-2 border font-semibold text-lg">𝑥</th><th class="px-4 py-2 border font-semibold text-lg">𝑦</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function drawGraph() {
  ctx = setupCanvas(canvas);
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  ctx.clearRect(0, 0, width, height);

  const margin = 65;
  const usableWidth = width - margin * 2;
  const usableHeight = height - margin * 2;
  const stepX = usableWidth / (xLabels.length + 1);

  tickStepY = getNiceTickInterval(yMax);


  let ySteps = Math.floor(yMax / tickStepY);
  if (ySteps < 6) {
    tickStepY = Math.max(1, Math.floor(yMax / 6));
    ySteps = Math.floor(yMax / tickStepY);
  }

  const stepY = usableHeight / ySteps;

  ctx.save();
  ctx.translate(margin, height - margin);
  ctx.scale(1, -1);

  ctx.strokeStyle = "#eee";
  for (let i = 0; i < xLabels.length; i++) {
    const x = stepX * (i + 1);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, usableHeight); ctx.stroke();
  }
  for (let i = 0; i <= ySteps; i++) {
    const y = stepY * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(usableWidth, y); ctx.stroke();
  }

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  drawArrow(ctx, -20, 0, usableWidth + 10, 0);
  drawArrow(ctx, 0, -20, 0, usableHeight + 10);

  ctx.fillStyle = "red";
  plottedPoints.forEach((point) => {
    const x = stepX * (point.i + 1);
    const y = (point.y / yMax) * usableHeight;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 2 * Math.PI); ctx.fill();
  });
  ctx.restore();

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#333";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  xLabels.forEach((label, i) => {
    const x = margin + stepX * (i + 1);
    ctx.fillText(label, x, height - margin + 6);
  });

  for (let i = 1; i <= ySteps; i++) {
    const val = i * tickStepY;
    const y = height - margin - stepY * i;
    if (i % 2 === 0 && val !== 0) {
      ctx.fillText(val, margin - 12, y - 5);
    }
  }

  ctx.fillText("O", margin - 10, height - margin + 6);
}

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  return ctx;
}

function drawArrow(ctx, fromX, fromY, toX, toY) {
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

function getNiceTickInterval(range) {
  const rough = range / 10;
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / pow10;

  if (range <= 600) {
    if (fraction <= 1.5) return 1 * pow10;
    if (fraction <= 3) return 2 * pow10;
    if (fraction <= 7) return 5 * pow10;
    return 10 * pow10;
  } else {
    if (fraction <= 1) return 1 * pow10;
    if (fraction <= 2) return 2 * pow10;
    if (fraction <= 5) return 5 * pow10;
    return 10 * pow10;
  }
}

function handleCanvasClick(e) {
  if (!selectedData.length) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  const mouseX = (e.clientX - rect.left) * dpr;
  const mouseY = (e.clientY - rect.top) * dpr;

  const margin = 65;
  const usableWidth = canvas.width - margin * 2;
  const usableHeight = canvas.height - margin * 2;
  const stepX = usableWidth / (xLabels.length + 1);

  const i = Math.round((mouseX - margin) / stepX) - 1;
  if (i < 0 || i >= xLabels.length) return;

  const graphY = yMax * (1 - (mouseY - margin) / usableHeight);
  if (graphY < -1 || graphY > yMax + 0.1) return;

  const point = plottedPoints.find((p) => p.i === i);
  if (point) point.y = graphY;
  else plottedPoints.push({ i, y: graphY });

  drawGraph();
}

function checkGraph() {
  if (!selectedData.length) return;
  feedbackClickCount++;

  const errorThreshold = 0.5;
  let incorrectX = [];

  for (let i = 0; i < selectedData.length; i++) {
    const correctY = selectedData[i].y;
    const point = plottedPoints.find((p) => p.i === i);
    const valid = point && Math.abs(point.y - correctY) <= errorThreshold + 1e-9;
    if (!valid) incorrectX.push(selectedData[i].x);
  }

  const allCorrect = incorrectX.length === 0;

  Swal.fire({
    icon: allCorrect ? 'success' : (feedbackClickCount === 1 ? 'info' : 'warning'),
    title: allCorrect ? '모든 점이 맞았어요!' : (feedbackClickCount === 1 ? `총 ${selectedData.length - incorrectX.length}개가 정확해요.` : `틀린 x좌표: ${incorrectX.join(', ')}`),
    text: allCorrect ? '이제 다음 단계로 이동하세요!' : '틀린 점을 다시 확인해보세요.',
    confirmButtonText: '확인'
  });

  if (allCorrect) {
    const storedPoints = selectedData.map((d) => ({ x: d.x, y: d.y }));
    localStorage.setItem('graphData', JSON.stringify({
      points: selectedPoints,
      uniqueX: uniqueX,
      axisMax: { x: uniqueX.length, y: yMax },  // yMax는 page1에서 계산한 값 그대로
      yTickStep: tickStepY,                    // page1에서 계산된 tickStepY를 그대로 넘김
      xAxisLabel: xAxisLabel,
      yAxisLabel: yAxisLabel
    }));
  }
}

function handleNextStep() {
  const selectedIndex = document.getElementById("dataSelect").value;
  if (selectedIndex === '') {
    Swal.fire({
      icon: "warning",
      title: "데이터 선택 필요!",
      text: "데이터를 먼저 선택하세요.",
      confirmButtonText: "확인"
    });
    return;
  }

  localStorage.setItem('selectedDataIndex', selectedIndex);

  Swal.fire({
    icon: "success",
    title: "저장 완료!",
    text: "다음 단계로 이동합니다.",
    confirmButtonText: "확인",
  }).then(() => {
    window.location.href = "page2.html";
  });
}

// 전역 등록
window.handleNextStep = handleNextStep;
