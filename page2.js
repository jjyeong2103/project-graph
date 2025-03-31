document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('tooltip');
  const padding = 60;

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
    ctx.translate(padding, height - padding);
    ctx.scale(1, -1);

    // 배경 격자
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

    // 점 찍기
    ctx.fillStyle = 'blue';
    points.forEach(p => {
      const xIndex = uniqueX.indexOf(p.x);
      if (xIndex === -1) return;
      const x = xIndex * xStep;
      const y = p.y * yUnit;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // 축 눈금
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
});
