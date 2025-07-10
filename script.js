let correctScore = localStorage.getItem('correctScore') ? parseInt(localStorage.getItem('correctScore')) : 0;
let incorrectScore = localStorage.getItem('incorrectScore') ? parseInt(localStorage.getItem('incorrectScore')) : 0;
let totalQuestionsAnswered = correctScore + incorrectScore;
let includeCivilians = true;
let currentTerroristData = [];
let isAnswering = false;

const quizContainer = document.getElementById('quiz-container');
const answerButtonsContainer = document.getElementById('answer-buttons');
const scoreboard = document.getElementById('scoreboard');
const resetButton = document.getElementById('reset-button');
const civiliansToggle = document.getElementById('include-civilians-toggle');

document.addEventListener('DOMContentLoaded', function() {
  updateScoreboard();
  displayQuiz();
  addEventListeners();
});

function addEventListeners() {
  resetButton.addEventListener('click', resetScore);
  civiliansToggle.addEventListener('change', toggleIncludeCivilians);
}

function resetScore() {
  Swal.fire({
    title: 'Skoru Sıfırla',
    text: 'Tüm skorlar sıfırlanacak. Emin misiniz?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Evet, sıfırla',
    cancelButtonText: 'İptal',
    confirmButtonColor: '#ebd518',
    cancelButtonColor: '#d33'
  }).then((result) => {
    if (result.isConfirmed) {
      correctScore = 0;
      incorrectScore = 0;
      totalQuestionsAnswered = 0;
      updateScoreboard();
      
      Swal.fire({
        title: 'Sıfırlandı!',
        text: 'Skorlar başarıyla sıfırlandı.',
        icon: 'success',
        confirmButtonText: 'Tamam',
        confirmButtonColor: '#ebd518'
      });
    }
  });
}

function toggleIncludeCivilians() {
  includeCivilians = civiliansToggle.checked;
  displayQuiz();
}

async function fetchTerroristData() {
  try {
    showLoading();
    const response = await fetch('https://raw.githubusercontent.com/osumatu/terorist-quiz/main/data.json');

    if (!response.ok) {
      throw new Error('Hata: Veriler yüklenemedi, lütfen sayfayı yenileyin.');
    }
    
    const data = await response.json();
    return data.filter((terrorist) => !!terrorist.GorselURL?.length)
      .map(terrorist => {
        terrorist.IlkGorselURL = "https://www.terorarananlar.pol.tr/" + terrorist.IlkGorselURL;
        return terrorist;
      });

  } catch (error) {
    console.error('Error fetching data:', error);
    showError('Veriler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    return [];
  }
}

async function fetchCivilianData() {
  try {
    const civilianData = [];
    for (let i = 0; i < 750; i++) {
      const timestamp = new Date().getTime() + i;
      const civilianImageUrl = `https://thispersondoesnotexist.com/?timestamp=${timestamp}`;
      civilianData.push({
        TOrgutAdi: 'Sivil',
        IlkGorselURL: civilianImageUrl
      });
    }
    return civilianData;
  } catch (error) {
    console.error('Hata: Sivil verileri alınamadı:', error);
    return [];
  }
}

async function populateQuizData() {
  let terroristData = await fetchTerroristData();
  let civilianData = [];

  if (includeCivilians) {
    civilianData = await fetchCivilianData();
  }

  const combinedData = includeCivilians ? [...terroristData, ...civilianData] : terroristData;
  combinedData.sort(() => Math.random() - 0.5);

  return combinedData;
}

function showLoading() {
  quizContainer.innerHTML = `
    <div class="loading">
      Yükleniyor
    </div>
  `;
  answerButtonsContainer.innerHTML = '';
}

function showError(message) {
  quizContainer.innerHTML = `
    <div style="text-align: center; color: #ff6b6b; font-weight: bold;">
      ${message}
    </div>
  `;
  answerButtonsContainer.innerHTML = '';
}

async function displayQuiz() {
  if (isAnswering) return;
  
  showLoading();
  
  const terroristData = await populateQuizData();

  if (terroristData.length === 0) {
    showError('Hata: Veriler yüklenemedi. Lütfen sayfayı yenileyin.');
    return;
  }

  const randomIndex = Math.floor(Math.random() * terroristData.length);
  const currentTerrorist = terroristData[randomIndex];
  const correctAnswer = currentTerrorist.TOrgutAdi;
  const uniqueTerroristNames = Array.from(new Set(terroristData.map(data => data.TOrgutAdi)));
  
  const indexToRemove = uniqueTerroristNames.indexOf(correctAnswer);
  if (indexToRemove !== -1) {
    uniqueTerroristNames.splice(indexToRemove, 1);
  }

  const incorrectAnswers = [];
  for (let i = 0; i < 3 && uniqueTerroristNames.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * uniqueTerroristNames.length);
    incorrectAnswers.push(uniqueTerroristNames[randomIndex]);
    uniqueTerroristNames.splice(randomIndex, 1);
  }

  const allAnswers = [correctAnswer, ...incorrectAnswers].sort(() => Math.random() - 0.5);

  quizContainer.innerHTML = `
    <img src="${currentTerrorist.IlkGorselURL}" alt="Quiz Image" onload="imageLoaded()" onerror="imageError(this)">
  `;

  answerButtonsContainer.innerHTML = allAnswers.map((answer, index) => `
    <button class="answer-button" onclick="checkAnswer('${correctAnswer.replace(/'/g, "\\'")}', '${answer.replace(/'/g, "\\'")}', this)" style="animation-delay: ${index * 0.1}s">
      <span>${answer}</span>
    </button>
  `).join('');
}

window.imageLoaded = function() {
  const img = quizContainer.querySelector('img');
  if (img) {
    img.style.opacity = '0';
    setTimeout(() => {
      img.style.transition = 'opacity 0.5s ease-in-out';
      img.style.opacity = '1';
    }, 100);
  }
}

window.imageError = function(img) {
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjI1IiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDIyNSAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMjUiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LXNpemU9IjE2Ij5Gb3RvZ3JhZiBZw7xrbGVuZW1lZGk8L3RleHQ+Cjwvc3ZnPg==';
  img.alt = 'Fotoğraf Yüklenemedi';
}

window.checkAnswer = function(correctAnswer, selectedAnswer, buttonElement) {
  if (isAnswering) return;
  isAnswering = true;

  const allButtons = document.querySelectorAll('.answer-button');
  allButtons.forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
  });

  buttonElement.style.backgroundColor = selectedAnswer === correctAnswer ? '#28a745' : '#dc3545';
  buttonElement.style.transform = 'scale(0.95)';

  setTimeout(() => {
    if (selectedAnswer === correctAnswer) {
      Swal.fire({
        icon: 'success',
        title: 'Bravo!',
        text: 'Doğru cevap!',
        confirmButtonText: 'Devam',
        confirmButtonColor: '#ebd518',
        timer: 2000,
        timerProgressBar: true
      }).then(() => {
        correctScore++;
        updateScoreboard();
        isAnswering = false;
        checkQuestionCount();
      });
    } else {
      allButtons.forEach(btn => {
        if (btn.textContent.trim() === correctAnswer) {
          btn.style.backgroundColor = '#28a745';
          btn.style.animation = 'correctAnswerPulse 0.5s ease-in-out';
        }
      });

      Swal.fire({
        icon: 'error',
        title: 'Maalesef!',
        text: `Doğru cevap: ${correctAnswer}`,
        confirmButtonText: 'Devam',
        confirmButtonColor: '#ebd518',
        timer: 3000,
        timerProgressBar: true
      }).then(() => {
        incorrectScore++;
        updateScoreboard();
        isAnswering = false;
        checkQuestionCount();
      });
    }
  }, 500);
}

async function checkQuestionCount() {
  totalQuestionsAnswered++;

  if (totalQuestionsAnswered % 20 === 0) {
    const successRate = ((correctScore / totalQuestionsAnswered) * 100).toFixed(2);

    let title = '';
    let icon = 'info';

    if (successRate >= 80) {
      title = 'MIT göreve çağırıyor!';
      icon = 'success';
    } else if (successRate >= 60) {
      title = 'Yürü be babuş!';
      icon = 'success';
    } else if (successRate >= 40) {
      title = 'Ha gayret.';
      icon = 'warning';
    } else {
      title = 'Hocam göz var izan var ya.';
      icon = 'error';
    }

    const result = await Swal.fire({
      title: title,
      text: `%${successRate} oranla doğru bildin. Devam mı baştan mı?`,
      icon: icon,
      showCancelButton: true,
      confirmButtonText: 'Devam',
      cancelButtonText: 'Baştan',
      confirmButtonColor: '#ebd518',
      cancelButtonColor: '#a37434'
    });

    if (result.isConfirmed) {
      displayQuiz();
    } else {
      correctScore = 0;
      incorrectScore = 0;
      totalQuestionsAnswered = 0;
      updateScoreboard();
      displayQuiz();
    }
  } else {
    setTimeout(() => {
      displayQuiz();
    }, 500);
  }
}

function updateScoreboard() {
  scoreboard.innerHTML = `
    <div>Doğru: <span style="color: #28a745; font-weight: bold;">${correctScore}</span></div>
    <div>Yanlış: <span style="color: #dc3545; font-weight: bold;">${incorrectScore}</span></div>
  `;

  localStorage.setItem('correctScore', correctScore);
  localStorage.setItem('incorrectScore', incorrectScore);

  scoreboard.style.transform = 'scale(1.05)';
  setTimeout(() => {
    scoreboard.style.transform = 'scale(1)';
  }, 200);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes correctAnswerPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); box-shadow: 0 0 20px #28a745; }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);