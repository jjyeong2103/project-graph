import Swal from 'sweetalert2';

// 전역 변수 선언
let selectedData = [];           // 선택된 데이터셋 배열
let plottedPoints = [];          // 사용자가 찍은 점 배열
let canvas, ctx;                 // 캔버스 및 컨텍스트
let xLabels = [];                // x축 라벨 배열
let yMax = 0;                    // y축 최대값
let tickStepY = 0;               // y축 눈금 간격
let xAxisLabel = "x";            // x축 이름
let yAxisLabel = "y";            // y축 이름
let feedbackClickCount = 0;      // 피드백 클릭 횟수
let xMin = 0;                    // x축 최소값 (0 여부 확인용)
let completedDataIndices = new Set();  // 완료한 데이터셋 index 기록
const MIN_REQUIRED_SETS = 3;           // 최소 완료해야 할 개수
let studentGraphs = {};  // 자료 인덱스별로 점 배열 저장

// 초기 설정
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("graphCanvas");
  ctx = canvas.getContext("2d");
  

  
  // 데이터 선택 드롭다운 렌더링
  renderDataList();

  // 이벤트 리스너 등록
  document.getElementById("dataSelect").addEventListener("change", loadSelectedData);
  document.getElementById("checkGraphBtn").addEventListener("click", checkGraph);
  document.getElementById("clearPointsBtn").addEventListener("click", () => {
    plottedPoints = [];
    drawGraph();  // 초기화 후 다시 그리기
  });

  const nextStepBtn = document.getElementById("nextStepBtn");
  nextStepBtn.addEventListener("click", handleNextStep);
  nextStepBtn.disabled = true;  // 처음에 비활성화
  nextStepBtn.classList.add('bg-gray-400');

  // 캔버스 클릭으로 점 찍기
  canvas.addEventListener("click", handleCanvasClick);

  const addPracticeBtn = document.getElementById("addPracticeBtn");
addPracticeBtn.disabled = true;
addPracticeBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
addPracticeBtn.classList.add('bg-gray-400', 'cursor-not-allowed');

addPracticeBtn.addEventListener("click", () => {
  const select = document.getElementById("dataSelect");
  const selectedValue = select.value;
  const currentIndex = isNaN(parseInt(selectedValue)) ? null : parseInt(selectedValue);

  const incompleteIndices = predefinedData
    .map((_, i) => i)
    .filter(i => !completedDataIndices.has(i) && i !== currentIndex);

  if (incompleteIndices.length === 0) {
    Swal.fire({
      icon: 'info',
      title: '모든 자료를 연습했어요!',
      text: '더 이상 남은 자료가 없어요.',
      confirmButtonText: '확인'
    });
    return;
  }

  const randomIndex = incompleteIndices[Math.floor(Math.random() * incompleteIndices.length)];

  let found = false;
  for (let option of select.options) {
    if (option.value === String(randomIndex)) {
      found = true;
      break;
    }
  }

  if (!found) {
    const opt = document.createElement("option");
    opt.value = String(randomIndex);
    opt.textContent = "🔁 " + predefinedData[randomIndex].name;
    select.appendChild(opt);
  }

  renderDataList();                        // 리스트 재정렬
  select.value = String(randomIndex);     // 선택 강제 지정
  loadSelectedDataByIndex(randomIndex);   // 데이터 로딩
});

});

// 미리 정의된 데이터셋
const predefinedData = [
  { name: "추의 개수(개)에 따른 용수철의 길이(cm)", data: [{ x: "1", y: 4 }, { x: "2", y: 8 }, { x: "3", y: 12 }, { x: "4", y: 16 }, { x: "5", y: 20 }] },
  { name: "모자 뜨기 꾸러미(개)에 따른 모자의 개수(개)", data: [{ x: "1", y: 2 }, { x: "2", y: 4 }, { x: "3", y: 6 }, { x: "4", y: 8 }, { x: "5", y: 10 }] },
  { name: "반려 식물의 키를 관찰하기 시작한 주차(주)에 따른 식물의 키(cm)", data: [{ x: "1", y: 2 }, { x: "2", y: 4 }, { x: "3", y: 6 }, { x: "4", y: 8 }, { x: "5", y: 10 }] },
  { name: "동영상 업로드 후 경과 일수(일)에 따른 조회 수(회)", data: [{ x: "1", y: 15 }, { x: "2", y: 30 }, { x: "3", y: 60 }, { x: "4", y: 85 }, { x: "5", y: 105 }] },
  { name: "달리기를 시작한 시간(분)에 따른 맥박 수(회)", data: [{ x: "0", y: 60 }, { x: "1", y: 100 }, { x: "2", y: 130 }, { x: "3", y: 140 }, { x: "4", y: 150 }] }
];

  function renderDataList() {
  const select = document.getElementById("dataSelect");

  // 현재 선택된 값 유지
  const currentValue = select.value;

  // 기존 옵션의 value만 저장
  const existingOptionValues = new Set();
  for (let option of select.options) {
    if (option.value !== "") {
      existingOptionValues.add(option.value);
    }
  }

  // 초기화
  select.innerHTML = `<option value="">-- 자료를 선택하세요 --</option>`;

  // 상위 3개 또는 기존에 있던 자료 유지
  predefinedData.forEach((dataset, index) => {
    if (index < 3 || existingOptionValues.has(String(index))) {
      const option = document.createElement("option");
      option.value = String(index);

      const isCompleted = completedDataIndices.has(index);
      option.textContent = (index >= 3 ? "🔁 " : "") + (isCompleted ? `✅ ${dataset.name}` : dataset.name);

      select.appendChild(option);
    }
  });

  // 선택값 복원
  if (currentValue) select.value = currentValue;
}


// 데이터 선택 시 호출되는 함수
function loadSelectedData() {
  const selectedIndex = parseInt(document.getElementById("dataSelect").value);
  if (isNaN(selectedIndex)) return;

  const selectedSet = predefinedData[selectedIndex];
  selectedData = selectedSet.data;
  xLabels = selectedData.map((d) => d.x);
  yMax = Math.ceil(Math.max(...selectedData.map((d) => d.y)) * 1.2);

  // 중복 선택 방지
  if (completedDataIndices.has(selectedIndex)) {
  Swal.fire({
    icon: 'info',
    title: '이미 완료한 자료입니다',
    text: '이미 그래프를 완성한 자료예요. 다른 자료를 선택해 보세요!',
    confirmButtonText: '확인'
  });
   return;
}

  // x 최솟값 설정
  const xValues = selectedData.map(d => parseInt(d.x));
  xMin = Math.min(...xValues);

  // 축 이름
  xAxisLabel = "x";
  yAxisLabel = "y";

  // 상태 초기화
  plottedPoints = [];
  feedbackClickCount = 0;
  drawGraph();
  showDataPreview();

  // 다음 단계 버튼 다시 비활성화
  const nextStepBtn = document.getElementById("nextStepBtn");

if (completedDataIndices.size < MIN_REQUIRED_SETS) {
  nextStepBtn.disabled = true;
  nextStepBtn.classList.add('bg-gray-400');
  nextStepBtn.classList.remove('bg-green-500');
} else {
  nextStepBtn.disabled = false;
  nextStepBtn.classList.remove('bg-gray-400');
  nextStepBtn.classList.add('bg-green-500');
}
}

// 데이터 미리보기 테이블 표시
function showDataPreview() {
  const preview = document.getElementById("dataPreview");
  if (!selectedData.length) {
    preview.innerHTML = "";
    return;
  }

  // 선택된 데이터셋의 이름에서 설명 추출
  const selectedIndex = parseInt(document.getElementById("dataSelect").value);
  let xDescription = "", yDescription = "";
  const nameParts = predefinedData[selectedIndex].name.split("에 따른");
  if (nameParts.length === 2) {
    xDescription = nameParts[0].trim();
    yDescription = nameParts[1].trim();
  }

  // 테이블 행 생성
  const rows = selectedData.map((d, i) => `
    <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
      <td class="px-4 py-2 border text-center">${d.x}</td>
      <td class="px-4 py-2 border text-center">${d.y}</td>
    </tr>`).join("");

  // 테이블 렌더링
  preview.innerHTML = `
    <table class="table-auto w-full border-collapse border border-gray-300 rounded shadow-sm overflow-hidden">
      <thead class="bg-gray-100 text-gray-700">
        <tr>
          <th class="px-4 py-2 border font-semibold text-lg">
            <span class="italic">𝑥</span><br><span class="text-sm text-gray-600">(${xDescription})</span>
          </th>
          <th class="px-4 py-2 border font-semibold text-lg">
            <span class="italic">𝑦</span><br><span class="text-sm text-gray-600">(${yDescription})</span>
          </th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// 캔버스에 그래프 그리기
function drawGraph() {
  ctx = setupCanvas(canvas);
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  ctx.clearRect(0, 0, width, height);

  const margin = 65;
  const usableWidth = width - margin * 2;
  const usableHeight = height - margin * 2;

  const stepX = usableWidth / (xLabels.length - (xMin === 0 ? 1 : 0));
  tickStepY = getNiceTickInterval(yMax);

  let ySteps = Math.floor(yMax / tickStepY);
  if (ySteps < 6) {
    tickStepY = Math.max(1, Math.floor(yMax / 6));
    ySteps = Math.floor(yMax / tickStepY);
  }
  const stepY = usableHeight / ySteps;

  // 좌표계 반전 후 격자선 그리기
  ctx.save();
  ctx.translate(margin, height - margin);
  ctx.scale(1, -1);

  // 격자선
  ctx.strokeStyle = "#eee";
  for (let i = 0; i <= xLabels.length; i++) {
    const x = stepX * i;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, usableHeight); ctx.stroke();
  }
  for (let i = 0; i <= ySteps; i++) {
    const y = stepY * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(usableWidth, y); ctx.stroke();
  }

  // x, y축과 화살표 그리기
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  drawArrow(ctx, -20, 0, usableWidth + 20, 0);
  drawArrow(ctx, 0, -20, 0, usableHeight + 20);

  // 점 찍기
  ctx.fillStyle = "red";
  plottedPoints.forEach((point) => {
    const x = stepX * (point.i + (xMin === 0 ? 0 : 1));
    const y = (point.y / yMax) * usableHeight;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 2 * Math.PI); ctx.fill();
  });
  ctx.restore();

  // 축 이름 및 숫자 라벨 그리기
ctx.save();
ctx.fillStyle = "#333";
ctx.font = "italic 16px sans-serif";
ctx.textAlign = "center";

// x축 이름: 오른쪽 아래
ctx.textBaseline = "top";
ctx.fillText("𝑥", width - margin + 15, height - margin + 10);

// y축 이름: y축 화살표 바로 위
ctx.textBaseline = "bottom";
ctx.fillText("𝑦", margin - 15, margin - 10);

ctx.restore();
ctx.restore();


  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#333";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("O", margin - 12, height - margin + 6);

  for (let i = 0; i < xLabels.length; i++) {
    if (xMin === 0 && xLabels[i] === "0") continue;
    const x = margin + stepX * (i + (xMin === 0 ? 0 : 1));
    ctx.fillText(xLabels[i], x, height - margin + 6);
  }
  for (let i = 1; i <= ySteps; i++) {
    const val = i * tickStepY;
    const y = height - margin - stepY * i;
    if (i % 2 === 0 && val !== 0) {
      ctx.fillText(val, margin - 20, y - 5);
    }
  }
}

// 캔버스 클릭 시 점 찍기 (좌표 계산)
function handleCanvasClick(e) {
  if (!selectedData.length) return;

  const rect = canvas.getBoundingClientRect();  
  const margin = 65;

  const usableWidth = rect.width - margin * 2;
  const usableHeight = rect.height - margin * 2;
  const stepX = usableWidth / (xLabels.length - (xMin === 0 ? 1 : 0));

  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const i = Math.round((mouseX - margin) / stepX) - (xMin === 0 ? 0 : 1);
  if (i < 0 || i >= xLabels.length) return;

  
  const graphOriginY = rect.height - margin;
  let yInGraph = graphOriginY - mouseY;
  yInGraph = Math.max(0, Math.min(yInGraph, usableHeight));


  let yRatio = yInGraph / usableHeight;
  let dataY = yRatio * yMax;

  const point = plottedPoints.find((p) => p.i === i);
  if (point) point.y = dataY;
  else plottedPoints.push({ i, y: dataY });

  drawGraph();
}



// 캔버스 고해상도 대응 초기화
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


// 화살표 그리기
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

// y축 눈금 적당히 나누는 함수
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

// 점검 버튼 클릭 시 피드백 처리
function checkGraph() {
  if (!selectedData.length) return;
  feedbackClickCount++;

  const studentId = localStorage.getItem('studentId');
  const studentName = localStorage.getItem('studentName');
  const startTime = localStorage.getItem('startTime');
  const selectedIndex = parseInt(document.getElementById("dataSelect").value);
  const selectedDataName = predefinedData[selectedIndex]?.name || '';

  const errorThreshold = 2;
  let incorrectX = [];
  for (let i = 0; i < selectedData.length; i++) {
    const correctY = selectedData[i].y;
    const point = plottedPoints.find((p) => p.i === i);
    const valid = point && Math.abs(point.y - correctY) <= errorThreshold + 1e-9;
    if (!valid) incorrectX.push(selectedData[i].x);
  }

  const allCorrect = incorrectX.length === 0;
  const pointsLog = plottedPoints.map(p => `${selectedData[p.i].x}:${p.y.toFixed(2)}`).join(', ');
  const feedbackLog = allCorrect ? '모두 정답' : `틀린 x좌표: ${incorrectX.join(', ')}`;

  // 구글 폼 전송
  const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeN2JCNj5pzz0r3TwRagOtK6oSCIZQoEYsCJF_crbmykdJkyg/formResponse';
  const formData = new FormData();
  formData.append('entry.1271583286', studentId);
  formData.append('entry.430525333', studentName);
  formData.append('entry.1017432853', startTime);
  formData.append('entry.1918871612', selectedDataName);
  formData.append('entry.1607663077', feedbackClickCount);
  formData.append('entry.385990551', pointsLog);
  formData.append('entry.541292745', feedbackLog);

  fetch(formUrl, {
    method: 'POST',
    mode: 'no-cors',
    body: formData
  });

  // 버튼 상태 업데이트
  const nextStepBtn = document.getElementById("nextStepBtn");
  if (allCorrect) {
  completedDataIndices.add(selectedIndex);  // 이 자료 인덱스를 완료 목록에 추가
  renderDataList();                         // 표기 다시 렌더링

  studentGraphs[selectedDataName] = plottedPoints.map(p => ({
    x: selectedData[p.i].x,
    y: parseFloat(p.y.toFixed(2))
  }));
  localStorage.setItem("studentGraphs", JSON.stringify(studentGraphs));

   localStorage.setItem("selectedDataIndex", selectedIndex); 

  const progressText = `(${completedDataIndices.size}/${MIN_REQUIRED_SETS})`;

  if (completedDataIndices.size >= MIN_REQUIRED_SETS) {
  addPracticeBtn.disabled = false;
  addPracticeBtn.classList.remove("bg-gray-400", "cursor-not-allowed");
  addPracticeBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
  
  nextStepBtn.disabled = false;
  nextStepBtn.classList.remove('bg-gray-400');
  nextStepBtn.classList.add('bg-green-500');
}

  Swal.fire({
    icon: 'success',
    title: completedDataIndices.size >= MIN_REQUIRED_SETS
      ? `모든 점이 맞았어요! ${progressText}`
      : `정확해요! ${progressText}`,
    text: completedDataIndices.size >= MIN_REQUIRED_SETS
      ? '이제 다음 단계로 이동할 수 있어요.'
      : '다른 자료도 시도해보세요!',
    confirmButtonText: '확인'
  });

  } else {
  Swal.fire({
    icon: feedbackClickCount === 1 ? 'info' : 'warning',
    title: feedbackClickCount === 1
      ? `총 ${selectedData.length - incorrectX.length}개가 정확해요.`
      : `틀린 x좌표: ${incorrectX.join(', ')}`,
    text: '틀린 점을 다시 확인해보세요.',
    confirmButtonText: '확인'
  });
}
}


// 다음 단계 버튼 클릭 시
function handleNextStep() {
  const studentGraphs = JSON.parse(localStorage.getItem("studentGraphs") || "{}");
  const completedCount = Object.keys(studentGraphs).length;

  if (completedCount < MIN_REQUIRED_SETS) {
    Swal.fire({
      icon: "warning",
      title: "자료 부족!",
      text: `최소 ${MIN_REQUIRED_SETS}개의 그래프를 완성해야 다음 단계로 이동할 수 있어요.`,
      confirmButtonText: "확인"
    });
    return;
  }

  const selectedIndex = parseInt(localStorage.getItem("selectedDataIndex"));  // ✅ 선택 인덱스를 localStorage에서 불러옴
  if (isNaN(selectedIndex)) {
  Swal.fire({
    icon: "warning",
    title: "자료 선택 필요!",
    text: "자료를 먼저 선택하세요.",
    confirmButtonText: "확인"
  });
  return;
}

  const nextStepBtn = document.getElementById("nextStepBtn");
  if (nextStepBtn.disabled) {
    Swal.fire({
      icon: "warning",
      title: "점 찍기 먼저 완료!",
      text: "모든 점을 정확히 찍어야 다음 단계로 이동할 수 있어요",
      confirmButtonText: "확인"
    });
    return;
  }

  // 저장
  localStorage.setItem("selectedDataIndex", selectedIndex);
  localStorage.setItem("studentGraphs", JSON.stringify(studentGraphs));

  Swal.fire({
    icon: "success",
    title: "저장 완료!",
    text: "다음 단계로 이동합니다",
    confirmButtonText: "확인",
  }).then(() => {
    window.location.href = "page2.html";
  });
}


window.handleNextStep = handleNextStep;

function loadSelectedDataByIndex(index) {
  const selectedSet = predefinedData[index];
  if (!selectedSet) return;

  selectedData = selectedSet.data;
  xLabels = selectedData.map((d) => d.x);
  yMax = Math.ceil(Math.max(...selectedData.map((d) => d.y)) * 1.2);

  const xValues = selectedData.map(d => parseInt(d.x));
  xMin = Math.min(...xValues);

  xAxisLabel = "x";
  yAxisLabel = "y";

  plottedPoints = [];
  feedbackClickCount = 0;
  drawGraph();
  showDataPreviewFromIndex(index);

  const nextStepBtn = document.getElementById("nextStepBtn");

if (completedDataIndices.size < MIN_REQUIRED_SETS) {
  nextStepBtn.disabled = true;
  nextStepBtn.classList.add('bg-gray-400');
  nextStepBtn.classList.remove('bg-green-500');
} else {
  nextStepBtn.disabled = false;
  nextStepBtn.classList.remove('bg-gray-400');
  nextStepBtn.classList.add('bg-green-500');
}

}

function showDataPreviewFromIndex(index) {
  const preview = document.getElementById("dataPreview");
  if (!predefinedData[index]) {
    preview.innerHTML = "";
    return;
  }

  const dataset = predefinedData[index];
  let xDescription = "", yDescription = "";
  const nameParts = dataset.name.split("에 따른");
  if (nameParts.length === 2) {
    xDescription = nameParts[0].trim();
    yDescription = nameParts[1].trim();
  }

  const rows = dataset.data.map((d, i) => `
    <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
      <td class="px-4 py-2 border text-center">${d.x}</td>
      <td class="px-4 py-2 border text-center">${d.y}</td>
    </tr>`).join("");

  preview.innerHTML = `
    <table class="table-auto w-full border-collapse border border-gray-300 rounded shadow-sm overflow-hidden">
      <thead class="bg-gray-100 text-gray-700">
        <tr>
          <th class="px-4 py-2 border font-semibold text-lg">
            <span class="italic">𝑥</span><br><span class="text-sm text-gray-600">(${xDescription})</span>
          </th>
          <th class="px-4 py-2 border font-semibold text-lg">
            <span class="italic">𝑦</span><br><span class="text-sm text-gray-600">(${yDescription})</span>
          </th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}
