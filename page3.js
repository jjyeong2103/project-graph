document.addEventListener('DOMContentLoaded', () => {
  let chart;
  let selectedType = '';
  let selectedXLabel = '';
  let selectedYLabel = '';

  //좌표축, 원점 표시
  const axisArrowsPlugin = {
    id: 'axisArrows',
    afterDraw(chart, args, options) {
      const { ctx, chartArea, scales } = chart;
      const arrowSize = 8;
  
      ctx.save();
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#000';
      ctx.lineWidth = 2;

      const xStart = chartArea.left;
      const xEnd = chartArea.right;
      const yZero = scales.y.getPixelForValue(0);
  
      const yStart = chartArea.bottom;
      const yTop = chartArea.top;
      const xZero = scales.x.getPixelForValue(0);
  
  
      // x축
      ctx.beginPath();
      ctx.moveTo(chartArea.left - 20, yZero); 
      ctx.lineTo(chartArea.right + 1, yZero); 
      ctx.stroke();


  
      // x축 오른쪽 화살표
      ctx.beginPath();
      ctx.moveTo(xEnd, yZero);
      ctx.lineTo(xEnd - arrowSize, yZero - arrowSize / 2);
      ctx.moveTo(xEnd, yZero);
      ctx.lineTo(xEnd - arrowSize, yZero + arrowSize / 2);
      ctx.stroke();
  
      // y축 
      ctx.beginPath();
      ctx.moveTo(xZero, chartArea.bottom +20);
      ctx.lineTo(xZero, chartArea.top - 1);
      ctx.stroke();

  
      // y축 위쪽 화살표
      ctx.beginPath();
      ctx.moveTo(xZero, yTop);
      ctx.lineTo(xZero - arrowSize / 2, yTop + arrowSize);
      ctx.moveTo(xZero, yTop);
      ctx.lineTo(xZero + arrowSize / 2, yTop + arrowSize);
      ctx.stroke();


      // 원점에 "O" 표시
      ctx.font = '14px sans-serif';
      ctx.fillText('O', xZero - 15, yZero + 16);
  
      ctx.restore();
    }
  };
  

  // 그래프 유형과 축 라벨 후보
  const graphTypes = ['increasing', 'decreasing', 'periodic'];
  const labelOptions = {
    increasing: {
      yxPairs: {
        '에너지 소비량(kcal)': ['시간(h)'],
        '이동거리(km)': ['시간(분)'],
        '이동거리(m)': ['시간(초)', '시간(분)'],
        '온도(℃)': ['시간(초)', '시간(분)'],
        '속도(m/s)': ['시간(초)']
      }
    },
    decreasing: {
      yxPairs: {
        '속도(m/s)': ['시간(초)'],
        '온도(℃)': ['시간(초)', '시간(분)']
      }
    },
    periodic: {
      yxPairs: {
        '온도(℃)': ['시간(초)', '시간(분)']
      }
    }
  };
  

  // 랜덤 그래프 생성 함수
  function generateGraph() {
    const ctx = document.getElementById('graphCanvas').getContext('2d');

  // 랜덤 유형 선택
  selectedType = graphTypes[Math.floor(Math.random() * graphTypes.length)];
  const yxMap = labelOptions[selectedType].yxPairs;

  // y축 라벨 랜덤 선택
  const yLabels = Object.keys(yxMap);
  selectedYLabel = yLabels[Math.floor(Math.random() * yLabels.length)];

  // 해당 y에 가능한 x축 중 랜덤 선택
  const xCandidates = yxMap[selectedYLabel];
  selectedXLabel = xCandidates[Math.floor(Math.random() * xCandidates.length)];



    // x축 라벨 (0~19), y축 데이터 생성
    const labels = [...Array(20).keys()];
    let data = [];

    if (selectedType === 'increasing') {
      data = labels.map(i => i + Math.random() * 2);

    } else if (selectedType === 'decreasing') {
      data = labels.map(i => {
        if (i < 6) return 20 - i + Math.random();           // 감소
        if (i < 13) return 14 + Math.random() * 0.3;        // 평평한 구간
        return 13 - (i - 12) + Math.random() * 0.8;         // 다시 천천히 감소
      }); 
    } else if (selectedType === 'periodic') {
      data = labels.map(i => Math.sin(i / 2) * 5 + 10);
    }

    // 기존 차트 제거
    if (chart) chart.destroy();

    // 차트 생성
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '그래프',
          data: data,
          borderColor: 'blue',
          fill: false,
          tension: selectedType === 'periodic' ? 0.4 :  // 주기함수만 부드럽게
                   selectedType === 'increasing' || selectedType === 'decreasing' ? 0.1 : 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: '생성된 그래프가 나타내는 상황을 이야기로 만들어 해석하고, 피드백을 받아보세요'
          },
        tooltip: {
          callbacks: {
            label: function(context) {
              const y = context.parsed.y;
              return `y=${y.toFixed(2)}`;  // 소수점 2자리까지 출력
            }
          }
        }
      },


        scales: {
          x: {
            title: {
              display: true,
              text: selectedXLabel,
              font: { size: 14 },
              color: '#333'
            },
            ticks: {
              color: '#333',
              callback: function(value) {
                return value === 0 ? '' : value; // 0은 숨김
              }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: selectedYLabel,
              font: { size: 14 },
              color: '#333'
            },
            ticks: {
              color: '#333',
              callback: function(value) {
                return value === 0 ? '' : value; // 0은 숨김
              }
            }
          }
        }
      },
      plugins: [axisArrowsPlugin]
    });
  }

  // 피드백 요청 함수
  function requestFeedback() {
    const interpretationInput = document.getElementById('interpretation');
    const feedbackDiv = document.getElementById('feedback');

    // 요소 존재 여부 확인
    if (!interpretationInput || !feedbackDiv) {
      console.error('필요한 요소를 찾을 수 없습니다 (#interpretation 또는 #feedback).');
      return;
    }

    // 입력값 확인
    const text = interpretationInput.value.trim();
    if (!text) {
      feedbackDiv.textContent = '해석을 먼저 작성해주세요';
      feedbackDiv.classList.remove('hidden');
      return;
    }

    // GPT 프롬프트 구성
    const prompt = `
너는 중학생 수학 교사야. 아래 그래프 유형과 축 이름을 바탕으로 학생의 해석을 평가해줘.

[그래프 유형]: ${selectedType === 'increasing' ? '증가 함수' : selectedType === 'decreasing' ? '감소 함수' : '주기 함수'}
[x축]: ${selectedXLabel}
[y축]: ${selectedYLabel}

[학생의 해석]
${text}

1. 그래프와 해석이 일치하는지 확인해줘.
2. 오해하거나 틀린 내용이 있다면 설명해줘.
3. 해석을 더 명확히 할 수 있는 방향을 제시해줘.
4. 어투는 친절하고 구체적으로.
`;

    feedbackDiv.textContent = '피드백을 가져오는 중입니다';
    feedbackDiv.classList.remove('hidden');

    // GPT API 호출
    fetch('/.netlify/functions/gptProxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: '너는 수학 교사로서 중학생이 작성한 그래프 해석을 피드백하는 역할이야.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
      .then(response => response.json())
      .then(result => {
        const feedback = result.choices?.[0]?.message?.content || '피드백을 가져오는 데 실패했습니다.';
        feedbackDiv.textContent = feedback;
        feedbackDiv.classList.remove('hidden');
      })
      .catch(err => {
        console.error(err);
        feedbackDiv.textContent = '피드백 요청 중 오류가 발생했습니다.';
        feedbackDiv.classList.remove('hidden');
      });
  }

  // 해석 저장 함수 (학생 입력을 아래에 쌓기)
  function submitInterpretation() {
    const text = document.getElementById('interpretation').value.trim();
    if (!text) return;

    const interpretationsDiv = document.getElementById('interpretations');
    const newEntry = document.createElement('p');
    newEntry.textContent = `학생: ${text}`;
    interpretationsDiv.appendChild(newEntry);

    document.getElementById('interpretation').value = '';
  }

  // 함수들을 전역에 등록해서 HTML에서 호출 가능하게
  window.generateGraph = generateGraph;
  window.requestFeedback = requestFeedback;
  window.submitInterpretation = submitInterpretation;
});
