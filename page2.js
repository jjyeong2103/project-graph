let hoveredPoint = null;

// y축 눈금 간격을 보기 좋게 설정하는 함수
function getNiceTickInterval(range) {
  const rough = range / 8;
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / pow10;
  if (fraction <= 1) return 1 * pow10;
  if (fraction <= 2) return 2 * pow10;
  if (fraction <= 5) return 5 * pow10;
  return 10 * pow10;
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');
  const padding = 60;

  const stored = JSON.parse(localStorage.getItem('graphData') || '{}');
  const points = stored.points || [];
  const uniqueX = stored.uniqueX || [];
  const axisMax = stored.axisMax || { x: 10, y: 10 };
  const xAxisLabel = stored.xAxisLabel || 'x';
  const yAxisLabel = stored.yAxisLabel || 'y';
  if (points.length === 0 || uniqueX.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const xStep = usableWidth / (uniqueX.length + 1);
  const yUnit = usableHeight / axisMax.y;


  // 캔버스 해상도 보정
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

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
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(padding + 5, height - padding);
    ctx.scale(1, -1);

    // 시각적 강조: 물결
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    [[30, 40]].flat().forEach(xStart => {
      let xOffset = -20;
      let yOffset = -120;
      ctx.beginPath();
      ctx.moveTo(xStart + xOffset, 105 + yOffset);
      ctx.bezierCurveTo(xStart - 3 + xOffset, 110 + yOffset, xStart - 3 + xOffset, 115 + yOffset, xStart + xOffset, 120 + yOffset);
      ctx.bezierCurveTo(xStart + 3 + xOffset, 125 + yOffset, xStart + 3 + xOffset, 130 + yOffset, xStart + xOffset, 135 + yOffset);
      ctx.stroke();
    });

    // 세로선 (x축 격자)
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    uniqueX.forEach((_, i) => {
      const x = (i + 1) * xStep;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, usableHeight);
      ctx.stroke();
    });

    // 가로선 (y축 격자)
    const tickStepY = getNiceTickInterval(axisMax.y);
    for (let y = 0; y <= axisMax.y; y += tickStepY) {

      ctx.beginPath();
      ctx.moveTo(0, y * yUnit);
      ctx.lineTo(usableWidth, y * yUnit);
      ctx.stroke();
    }

    // 축 + 점 그리기
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    drawArrow(-20, 0, usableWidth + 10, 0);
    drawArrow(0, -20, 0, usableHeight + 10);

    ctx.fillStyle = 'blue';
    points.forEach(p => {
      const xIndex = uniqueX.indexOf(p.x);
      if (xIndex === -1) return;
      const x = (xIndex + 1) * xStep;
      const y = p.y * yUnit;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      if (hoveredPoint && hoveredPoint.x === p.x && hoveredPoint.y === p.y) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.scale(1, -1);
        ctx.fillText(`y=${p.y}`, x + 10, -y);
        ctx.scale(1, -1);
        ctx.fillStyle = 'blue';
      }
    });

    // 원점에 'O' 표시
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('O', -5, -15);


    ctx.restore();

    // x축 라벨
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

    // y축 눈금
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = 0; y <= axisMax.y; y += tickStepY) {
      const displayLabel = y + (window.yStart ?? 0);
      if (displayLabel === 0) continue;

      const yPos = height - padding - y * yUnit;
      ctx.fillText(displayLabel.toString(), padding - 10, yPos);
    }

    // 축 이름
    ctx.textAlign = 'center';
    ctx.fillText(xAxisLabel, padding + usableWidth / 2, height - padding + 50);
    ctx.save();
    ctx.translate(padding - 50, height - padding - usableHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();
  }

  drawGrid();

  // 마우스가 좌표에 올려졌는지 확인해서 y값 툴팁 띄움
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX / dpr;
    const mouseY = (e.clientY - rect.top) * scaleY / dpr;

    const cx = mouseX - padding - 5;
    const cy = height - mouseY - padding;

    hoveredPoint = null;
    for (const p of points) {
      const xIndex = uniqueX.indexOf(p.x);
      if (xIndex === -1) continue;
      const x = (xIndex + 1) * xStep;
      const y = p.y * yUnit;
      if (Math.hypot(cx - x, cy - y) < 10) {
        hoveredPoint = p;
        break;
      }
    }
    drawGrid();
  });

  // GPT를 활용한 피드백 요청
  const feedbackBtn = document.getElementById('feedbackBtn');
  const interpretationInput = document.getElementById('interpretation');
  const feedbackDiv = document.getElementById('feedback');

  feedbackBtn.addEventListener('click', async () => {
    const studentText = interpretationInput.value.trim();
    if (!studentText) {
      feedbackDiv.textContent = '해석을 먼저 작성해주세요.';
      feedbackDiv.classList.remove('hidden');
      return;
    }

    const prompt = `
너는 중학생 수학 과제를 채점하는 교사야.
학생이 작성한 그래프 해석 글을 보고, 아래 CSV 데이터와 비교하여 다음 항목을 평가해줘:

1. 데이터에 기반한 표현 오류를 지적해줘. 예: (1,2)인데 (2,1)로 쓴 경우.
2. 전반적인 해석이 데이터와 맞는지 확인하고, 맥락상 적절한 해석인지 피드백을 줘.
3. 필요한 경우 개선 방향을 제안해줘.

[CSV 데이터]
${xAxisLabel},${yAxisLabel}
${points.map(p => `${p.x},${p.y}`).join('\n')}

[학생의 해석]
${studentText}

친절하고 온전한 답이 아니라 학생의 그래프 해석을 도울 수 있는 힌트 정도의 피드백을 줘.`;

    feedbackDiv.textContent = '피드백을 가져오는 중입니다';
    feedbackDiv.classList.remove('hidden');

    try {
      const response = await fetch('/.netlify/functions/gptProxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-3.5',
          messages: [
            { role: 'system', content: '너는 수학 교사로서 중학교 1학년 학생이 작성한 그래프 해석을 피드백하는 역할이야.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      const result = await response.json();
      const feedback = result.choices?.[0]?.message?.content || '피드백을 가져오는 데 실패했습니다';
      feedbackDiv.textContent = feedback;
    } catch (error) {
      console.error(error);
      feedbackDiv.textContent = '피드백 요청 중 오류가 발생했습니다';
    }
  });
});