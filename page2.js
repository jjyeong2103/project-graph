let hoveredPoint = null;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');
  const padding = 60;

  // 그래프 데이터 로드
  const stored = JSON.parse(localStorage.getItem('graphData') || '{}');
  const points = stored.points || [];
  const uniqueX = stored.uniqueX || [];
  const axisMax = stored.axisMax || { x: 10, y: 10 };
  const xAxisLabel = stored.xAxisLabel || 'x';
  const yAxisLabel = stored.yAxisLabel || 'y';
  if (points.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const xStep = usableWidth / (uniqueX.length - 1);
  const yUnit = usableHeight / axisMax.y;

  // 캔버스 초기화
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  // 화살표 그리기
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

  // 좌표평면 및 점 렌더링
  function drawGrid() {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(padding, height - padding);
    ctx.scale(1, -1);

    // 격자
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    uniqueX.forEach((_, i) => {
      const x = i * xStep;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, usableHeight);
      ctx.stroke();
    });

    const tickStepY = Math.ceil(axisMax.y / 10);
    for (let y = 0; y <= axisMax.y; y += tickStepY) {
      ctx.beginPath();
      ctx.moveTo(0, y * yUnit);
      ctx.lineTo(usableWidth, y * yUnit);
      ctx.stroke();
    }

    // 축
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    drawArrow(0, 0, usableWidth + 10, 0);
    drawArrow(0, 0, 0, usableHeight + 10);

    // 점 그리기 및 hover 처리
    ctx.fillStyle = 'blue';
    points.forEach(p => {
      const xIndex = uniqueX.indexOf(p.x);
      if (xIndex === -1) return;
      const x = xIndex * xStep;
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

    ctx.restore();

    // 눈금
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    uniqueX.forEach((xVal, i) => {
      const xPos = padding + i * xStep;
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

    // 축 라벨
    ctx.textAlign = 'center';
    ctx.fillText(xAxisLabel, padding + usableWidth / 2, height - padding + 50);
    ctx.save();
    ctx.translate(padding - 50, height - padding - usableHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();
  }

  drawGrid();

  // 마우스 이동 시 hover 포인트 추적
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX / dpr;
    const mouseY = (e.clientY - rect.top) * scaleY / dpr;

    const cx = mouseX - padding;
    const cy = height - mouseY - padding;

    hoveredPoint = null;
    for (const p of points) {
      const xIndex = uniqueX.indexOf(p.x);
      if (xIndex === -1) continue;
      const x = xIndex * xStep;
      const y = p.y * yUnit;
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < 10) {
        hoveredPoint = p;
        break;
      }
    }
    drawGrid();
  });

  // ✨ 피드백 요청 기능
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

친절하고 구체적인 피드백을 줘.`;

    feedbackDiv.textContent = '피드백을 가져오는 중...';
    feedbackDiv.classList.remove('hidden');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '너는 수학 교사로서 중학생이 작성한 그래프 해석을 피드백하는 역할이야.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      const result = await response.json();
      const feedback = result.choices?.[0]?.message?.content || '피드백을 가져오는 데 실패했습니다.';
      feedbackDiv.textContent = feedback;
    } catch (error) {
      feedbackDiv.textContent = '피드백 요청 중 오류가 발생했습니다.';
      console.error(error);
    }
  });
});