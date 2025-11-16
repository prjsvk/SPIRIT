// Elements
const playModeBtn = document.getElementById('play-mode-btn');
const createModeBtn = document.getElementById('create-mode-btn');
const flashcardModeBtn = document.getElementById('flashcard-mode-btn');

const playSection = document.getElementById('play-section');
const createSection = document.getElementById('create-section');
const flashcardSection = document.getElementById('flashcard-section');

// Play mode elements
const quizSelect = document.getElementById('quiz-select');
const questionElement = document.getElementById('question');
const optionsElement = document.getElementById('options');
const feedbackElement = document.getElementById('feedback');
const feedbackIcon = document.getElementById('feedback-icon');
const feedbackText = document.getElementById('feedback-text');
const scoreElement = document.getElementById('score');
const streakElement = document.getElementById('streak');
const progressElement = document.getElementById('progress');
const timerBar = document.getElementById('timer-fill');
const timerText = document.getElementById('timer-text');
const questionNumber = document.getElementById('question-number');
const pointsWorth = document.getElementById('points-worth');

// Flashcard mode elements
const flashcardQuizSelect = document.getElementById('flashcard-quiz-select');
const flashcard = document.getElementById('flashcard');
const flashcardQuestion = document.getElementById('flashcard-question');
const flashcardAnswer = document.getElementById('flashcard-answer');
const prevCardBtn = document.getElementById('prev-card-btn');
const nextCardBtn = document.getElementById('next-card-btn');
const shuffleCardsBtn = document.getElementById('shuffle-cards-btn');
const cardCounter = document.getElementById('card-counter');
const masteryControls = document.getElementById('mastery-controls');
const masteredBtn = document.getElementById('mastered-btn');
const notMasteredBtn = document.getElementById('not-mastered-btn');

// Continue button
const continueBtn = document.getElementById('continue-btn');

// Create mode elements
const quizTitleInput = document.getElementById('quiz-title');
const questionsList = document.getElementById('questions-list');
const addQuestionBtn = document.getElementById('add-question-btn');
const saveQuizBtn = document.getElementById('save-quiz-btn');

  // Game state
  let currentQuestion = null;
  let score = 0;
  let streak = 0;
  let timer = null;
  let timeLeft = 30;
  let currentQuiz = [];
  let currentQuestionIndex = 0;
  let customQuizzes = JSON.parse(localStorage.getItem('customQuizzes')) || [];

  // Flashcard state
  let flashcardCards = [];
  let studyQueue = [];
  let currentStudyIndex = 0;
  let isFlipped = false;

  // Mode switching
  playModeBtn.addEventListener('click', () => switchMode('play'));
  createModeBtn.addEventListener('click', () => switchMode('create'));
  flashcardModeBtn.addEventListener('click', () => switchMode('flashcard'));

  function switchMode(mode) {
    // Remove active class from all buttons
    [playModeBtn, createModeBtn, flashcardModeBtn].forEach(btn => {
      btn.classList.remove('active');
    });

    // Hide all sections
    [playSection, createSection, flashcardSection].forEach(section => {
      section.classList.add('hidden');
    });

    // Show selected mode
    switch(mode) {
      case 'play':
        playModeBtn.classList.add('active');
        playSection.classList.remove('hidden');
        loadQuizOptions();
        resetGame();
        break;
      case 'create':
        createModeBtn.classList.add('active');
        createSection.classList.remove('hidden');
        renderQuestionsList();
        break;
      case 'flashcard':
        flashcardModeBtn.classList.add('active');
        flashcardSection.classList.remove('hidden');
        loadFlashcardOptions();
        break;
    }
  }

  // Load quiz options for play mode
  function loadQuizOptions() {
    quizSelect.innerHTML = '<option value="backend">Random Questions</option>';
    customQuizzes.forEach((quiz, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = quiz.title;
      quizSelect.appendChild(option);
    });
  }

  // Load quiz options for flashcard mode
  function loadFlashcardOptions() {
    flashcardQuizSelect.innerHTML = '<option value="">Select a quiz...</option>';
    customQuizzes.forEach((quiz, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = quiz.title;
      flashcardQuizSelect.appendChild(option);
    });
  }

  // Play quiz functionality
  async function fetchQuestion() {
    const selectedQuiz = quizSelect.value;

    if (selectedQuiz === 'backend') {
      try {
        const response = await fetch('/backend/quiz.py');
        const question = await response.json();
        currentQuestion = question;
        displayQuestion(currentQuestion);
        resetTimer();
      } catch (error) {
        console.error('Error fetching question:', error);
        questionElement.textContent = 'Error loading question. Please try again.';
      }
    } else {
      // Play custom quiz
      const quizIndex = parseInt(selectedQuiz);
      if (customQuizzes[quizIndex]) {
        // Filter out mastered questions for rotation
        currentQuiz = customQuizzes[quizIndex].questions.filter(q => q.mastery !== 'mastered');
        // If all mastered, show results
        if (currentQuiz.length === 0) {
          showFinalResults();
          return;
        }
        // If currentQuestionIndex out of bounds, reset
        if (currentQuestionIndex >= currentQuiz.length) {
          currentQuestionIndex = 0;
        }
        currentQuestion = currentQuiz[currentQuestionIndex];
        displayQuestion(currentQuestion);
        resetTimer();
      } else {
        showFinalResults();
      }
    }
  }

  function displayQuestion(question) {
  // Dynamic numbering: show current/total for remaining questions
  let displayIndex = currentQuestionIndex + 1;
  let displayTotal = currentQuiz.length;
  if (displayIndex > displayTotal) displayIndex = displayTotal;
  questionNumber.textContent = `${displayIndex} / ${displayTotal}`;
    pointsWorth.textContent = `+${calculatePoints()} points`;

    if (question.type === 'multiple-choice' && question.options) {
      questionElement.textContent = question.question;
      optionsElement.innerHTML = '';
      optionsElement.className = 'options-grid';

      question.options.forEach((option, index) => {
        const optionBtn = document.createElement('div');
        optionBtn.className = 'option-btn';
        optionBtn.innerHTML = `
          <span class="option-letter">${String.fromCharCode(65 + index)}</span>
          <span>${option}</span>
        `;
        optionBtn.addEventListener('click', () => selectAnswer(option, question.answer));
        optionsElement.appendChild(optionBtn);
      });
    } else if (question.type === 'true-false') {
      questionElement.textContent = question.question;
      optionsElement.innerHTML = '';
      optionsElement.className = 'true-false-grid';

      ['True', 'False'].forEach((option) => {
        const optionBtn = document.createElement('div');
        optionBtn.className = 'option-btn true-false-btn';
        optionBtn.textContent = option;
        optionBtn.addEventListener('click', () => selectAnswer(option.toLowerCase(), question.answer));
        optionsElement.appendChild(optionBtn);
      });
    } else {
      // Fallback for text input (fill-in-the-blank, short answer)
      questionElement.textContent = question.question;
      optionsElement.innerHTML = '<input type="text" id="text-answer" placeholder="Type your answer..." class="answer-input">';
      const answerInput = document.getElementById('text-answer');
      answerInput.focus();
      answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          selectAnswer(answerInput.value, question.answer);
        }
      });
    }
  }

  function selectAnswer(selectedAnswer, correctAnswer) {
    clearInterval(timer);
    const isCorrect = selectedAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    const points = calculatePoints();

    if (isCorrect) {
      score += points;
      streak++;
      showFeedback(true, `Correct! +${points} points`);
    } else {
      score -= points;
      streak = 0;
      showFeedback(false, `Incorrect. The answer was: ${correctAnswer} -${points} points`);
    }

    updateStats();
    let continueTimeout = setTimeout(nextQuestion, 2000);
    continueBtn.onclick = () => {
      clearTimeout(continueTimeout);
      feedbackElement.classList.add('hidden');
      nextQuestion();
    };
  }

  function showFeedback(isCorrect, message) {
    feedbackElement.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackIcon.textContent = isCorrect ? '✅' : '❌';
    feedbackText.textContent = message;
    feedbackElement.classList.remove('hidden');

    // Animate options
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
      if (btn.textContent.toLowerCase().includes(currentQuestion.correctAnswer.toLowerCase())) {
        btn.classList.add('correct');
      } else if (btn.classList.contains('selected')) {
        btn.classList.add('incorrect');
      }
    });
  }

  function calculatePoints() {
    const timeBonus = Math.max(0, Math.floor(timeLeft / 3));
    const streakBonus = Math.min(streak * 2, 20);
    return 10 + timeBonus + streakBonus;
  }

  function resetTimer() {
    clearInterval(timer);
    timeLeft = 30;
    updateTimerDisplay();

    timer = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();

      if (timeLeft <= 0) {
        clearInterval(timer);
        selectAnswer('', currentQuestion.answer); // Time's up
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const percentage = (timeLeft / 30) * 100;
    timerBar.style.width = `${percentage}%`;
    timerText.textContent = timeLeft;

    if (timeLeft <= 10) {
      timerBar.className = 'timer-fill danger';
    } else if (timeLeft <= 20) {
      timerBar.className = 'timer-fill warning';
    } else {
      timerBar.className = 'timer-fill';
    }
  }

  function nextQuestion() {
    feedbackElement.classList.add('hidden');
    // Remove mastered questions from rotation (handled in fetchQuestion)
    // If 'Still Learning', keep in rotation and repeat until final round
    if (currentQuestion && currentQuestion.mastery === 'still-learning') {
      currentQuestionIndex++;
      if (currentQuestionIndex >= currentQuiz.length) {
        currentQuestionIndex = 0;
      }
    } else {
      // Move to next question
      currentQuestionIndex++;
    }
    fetchQuestion();
  }

  function updateStats() {
  scoreElement.textContent = `Score: ${score}`;
  streakElement.textContent = `🔥 Streak: ${streak}`;
  progressElement.textContent = `Progress: ${currentQuestionIndex + 1}/${currentQuiz.length}`;
  }

  function showFinalResults() {
    const finalScore = score;
    const accuracy = currentQuiz.length > 0 ? Math.round((score / (currentQuiz.length * 10)) * 100) : 0;

    alert(`Quiz completed!\n\nFinal Score: ${finalScore}\nAccuracy: ${accuracy}%\nBest Streak: ${streak}`);

    resetGame();
  }

  function resetGame() {
    score = 0;
    streak = 0;
    currentQuestionIndex = 0;
    updateStats();
    clearInterval(timer);
    feedbackElement.classList.add('hidden');
  }

  quizSelect.addEventListener('change', () => {
    resetGame();
    fetchQuestion();
  });

  // Flashcard functionality
  flashcardQuizSelect.addEventListener('change', loadFlashcardQuiz);

  function loadFlashcardQuiz() {
    const quizIndex = flashcardQuizSelect.value;
    if (quizIndex === '') return;

    const quiz = customQuizzes[parseInt(quizIndex)];
  // Only include cards not mastered
  flashcardCards = [...quiz.questions];
  studyQueue = flashcardCards.map((card, i) => card.mastery !== 'mastered' ? i : null).filter(i => i !== null);
  currentStudyIndex = 0;
  isFlipped = false;

  shuffleCards();
  showCurrentCard();
  }

  function showCurrentCard() {
    if (studyQueue.length === 0) {
      showMasteryComplete();
      return;
    }

    const cardIndex = studyQueue[currentStudyIndex];
    const card = flashcardCards[cardIndex];
    flashcardQuestion.textContent = card.question;
    flashcardAnswer.textContent = card.answer || card.correctAnswer || 'No answer provided';

    flashcard.classList.remove('flipped');
    isFlipped = false;
    masteryControls.classList.add('hidden');

    updateCardCounter();
  }

  // Add click event to the flashcard itself to flip it
  flashcard.addEventListener('click', () => {
    if (!isFlipped) {
      flashcard.classList.add('flipped');
      isFlipped = true;
      masteryControls.classList.remove('hidden');
    }
  });

  prevCardBtn.addEventListener('click', () => {
    if (currentStudyIndex > 0) {
      currentStudyIndex--;
      showCurrentCard();
    }
  });

  nextCardBtn.addEventListener('click', () => {
    if (currentStudyIndex < studyQueue.length - 1) {
      currentStudyIndex++;
      showCurrentCard();
    }
  });

  shuffleCardsBtn.addEventListener('click', shuffleCards);

  function shuffleCards() {
    // Shuffle the study queue
    for (let i = studyQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [studyQueue[i], studyQueue[j]] = [studyQueue[j], studyQueue[i]];
    }
    currentStudyIndex = 0;
    showCurrentCard();
  }

  function updateCardCounter() {
    const totalCards = flashcardCards.length;
    const remainingCards = studyQueue.length;
    const masteredCount = totalCards - remainingCards;

    if (remainingCards === 0) {
      cardCounter.textContent = `All ${totalCards} mastered!`;
    } else {
      const currentCardNumber = currentStudyIndex + 1;
      cardCounter.textContent = `${currentCardNumber} / ${remainingCards}`;
    }
  }

  // Mastery button event listeners
  masteredBtn.addEventListener('click', () => markCardAsMastered(true));
  notMasteredBtn.addEventListener('click', () => markCardAsMastered(false));

  function markCardAsMastered(isMastered) {
    if (isMastered) {
      // Remove the current card from study queue (mastered)
      const cardIndex = studyQueue[currentStudyIndex];
      flashcardCards[cardIndex].mastery = 'mastered';
      studyQueue.splice(currentStudyIndex, 1);
      // Adjust index if necessary
      if (currentStudyIndex >= studyQueue.length && studyQueue.length > 0) {
        currentStudyIndex = studyQueue.length - 1;
      }
    } else {
      // Mark as still learning and move to next card
      const cardIndex = studyQueue[currentStudyIndex];
      flashcardCards[cardIndex].mastery = 'still-learning';
      if (currentStudyIndex < studyQueue.length - 1) {
        currentStudyIndex++;
      }
    }

    // Show next card or completion
    if (studyQueue.length === 0) {
      showMasteryComplete();
    } else {
      showCurrentCard();
    }
  }

  function showMasteryComplete() {
    flashcardQuestion.textContent = '🎉 Congratulations!';
    flashcardAnswer.textContent = `You've mastered all ${flashcardCards.length} cards in this quiz!`;
    flashcard.classList.add('flipped');
    masteryControls.classList.add('hidden');
    cardCounter.textContent = `All ${flashcardCards.length} mastered!`;
  }

  // Create quiz functionality
  function renderQuestionsList() {
    questionsList.innerHTML = '';
    const questions = getCurrentQuestions();
    questions.forEach((q, index) => {
      const questionItem = document.createElement('div');
      questionItem.className = 'question-item';

      if (q.type === 'true-false') {
        questionItem.innerHTML = `
          <select class="question-type-per-item" data-index="${index}">
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false" selected>True/False</option>
            <option value="fill-blank">Fill in the Blank</option>
            <option value="short-answer">Short Answer</option>
          </select>
          <input type="text" class="question-input" placeholder="Example: The sky is blue." value="${q.question || ''}">
          <div class="true-false-options">
            <label><input type="radio" name="answer-${index}" value="true" ${q.answer === 'true' ? 'checked' : ''}> True</label>
            <label><input type="radio" name="answer-${index}" value="false" ${q.answer === 'false' ? 'checked' : ''}> False</label>
          </div>
          <button class="delete-question-btn" data-index="${index}">Delete</button>
        `;
      } else if (q.type === 'multiple-choice') {
        const optionsHtml = (q.options || []).map((option, optIndex) => `
          <div class="option-input-group">
            <input type="radio" name="correct-${index}" value="${optIndex}" ${optIndex === q.correctIndex ? 'checked' : ''}>
            <input type="text" class="option-input" placeholder="Option ${String.fromCharCode(65 + optIndex)}" value="${option}">
            <button class="remove-option-btn">×</button>
          </div>
        `).join('');

        questionItem.innerHTML = `
          <select class="question-type-per-item" data-index="${index}">
            <option value="multiple-choice" selected>Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="fill-blank">Fill in the Blank</option>
            <option value="short-answer">Short Answer</option>
          </select>
          <input type="text" class="question-input" placeholder="What is the capital of France?" value="${q.question || ''}">
          <div class="multiple-choice-options">
            ${optionsHtml}
          </div>
          <button class="add-option-btn">+ Add Option</button>
          <button class="delete-question-btn">Delete Question</button>
        `;
      } else {
        questionItem.innerHTML = `
          <select class="question-type-per-item" data-index="${index}">
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="fill-blank" ${q.type === 'fill-blank' ? 'selected' : ''}>Fill in the Blank</option>
            <option value="short-answer" ${q.type === 'short-answer' ? 'selected' : ''}>Short Answer</option>
          </select>
          <input type="text" class="question-input" placeholder="Question" value="${q.question || ''}">
          <input type="text" class="answer-input" placeholder="Answer" value="${q.answer || ''}">
          <button class="delete-question-btn" data-index="${index}">Delete</button>
        `;
      }

      questionsList.appendChild(questionItem);
    });

    // Add event listeners for all question items
    document.querySelectorAll('.question-item').forEach(item => {
      setupQuestionItemEvents(item);
    });
  }

  function getCurrentQuestions() {
    return Array.from(document.querySelectorAll('.question-item')).map(item => {
      const question = item.querySelector('.question-input').value;
      const typeSelect = item.querySelector('.question-type-per-item');
      const questionType = typeSelect ? typeSelect.value : 'multiple-choice';

      let answer, options = [], correctIndex = 0;

      if (questionType === 'multiple-choice') {
        const optionInputs = item.querySelectorAll('.option-input');
        const selectedRadio = item.querySelector('input[type="radio"]:checked');
        
        options = Array.from(optionInputs).map(input => input.value);
        correctIndex = selectedRadio ? parseInt(selectedRadio.value) : 0;
        answer = options[correctIndex] || '';
      } else if (questionType === 'true-false') {
        const selectedRadio = item.querySelector('input[type="radio"]:checked');
        answer = selectedRadio ? selectedRadio.value : 'true';
      } else {
        answer = item.querySelector('.answer-input').value;
      }

      return {
        question,
        answer,
        type: questionType,
        options: questionType === 'multiple-choice' ? options : [],
        correctIndex: questionType === 'multiple-choice' ? correctIndex : undefined
      };
    }).filter(q => q.question.trim() && (q.answer.trim() || (q.type === 'multiple-choice' && q.options.length > 0)));
  }

  function addQuestion() {
    const questionType = 'multiple-choice';
    const questionItem = document.createElement('div');
    questionItem.className = 'question-item';

    if (questionType === 'true-false') {
      questionItem.innerHTML = `
        <select class="question-type-per-item" data-index="${document.querySelectorAll('.question-item').length}">
          <option value="multiple-choice">Multiple Choice</option>
          <option value="true-false" selected>True/False</option>
          <option value="fill-blank">Fill in the Blank</option>
          <option value="short-answer">Short Answer</option>
        </select>
        <input type="text" class="question-input" placeholder="Example: The sky is blue.">
        <div class="true-false-options">
          <label><input type="radio" name="answer-${Date.now()}" value="true" checked> True</label>
          <label><input type="radio" name="answer-${Date.now()}" value="false"> False</label>
        </div>
        <button class="delete-question-btn">Delete</button>
      `;
    } else if (questionType === 'multiple-choice') {
      questionItem.innerHTML = `
        <select class="question-type-per-item" data-index="${document.querySelectorAll('.question-item').length}">
          <option value="multiple-choice" selected>Multiple Choice</option>
          <option value="true-false">True/False</option>
          <option value="fill-blank">Fill in the Blank</option>
          <option value="short-answer">Short Answer</option>
        </select>
        <input type="text" class="question-input" placeholder="What is the capital of France?">
        <div class="multiple-choice-options">
          <div class="option-input-group">
            <input type="radio" name="correct-${Date.now()}" value="0" checked>
            <input type="text" class="option-input" placeholder="Option A" value="Paris">
            <button class="remove-option-btn">×</button>
          </div>
          <div class="option-input-group">
            <input type="radio" name="correct-${Date.now()}" value="1">
            <input type="text" class="option-input" placeholder="Option B" value="London">
            <button class="remove-option-btn">×</button>
          </div>
          <div class="option-input-group">
            <input type="radio" name="correct-${Date.now()}" value="2">
            <input type="text" class="option-input" placeholder="Option C" value="Berlin">
            <button class="remove-option-btn">×</button>
          </div>
          <div class="option-input-group">
            <input type="radio" name="correct-${Date.now()}" value="3">
            <input type="text" class="option-input" placeholder="Option D" value="Madrid">
            <button class="remove-option-btn">×</button>
          </div>
        </div>
        <button class="add-option-btn">+ Add Option</button>
        <button class="delete-question-btn">Delete Question</button>
      `;
    } else {
      questionItem.innerHTML = `
        <select class="question-type-per-item" data-index="${document.querySelectorAll('.question-item').length}">
          <option value="multiple-choice">Multiple Choice</option>
          <option value="true-false">True/False</option>
          <option value="fill-blank" ${questionType === 'fill-blank' ? 'selected' : ''}>Fill in the Blank</option>
          <option value="short-answer" ${questionType === 'short-answer' ? 'selected' : ''}>Short Answer</option>
        </select>
        <input type="text" class="question-input" placeholder="Question">
        <input type="text" class="answer-input" placeholder="Answer">
        <button class="delete-question-btn">Delete</button>
      `;
    }

    questionsList.appendChild(questionItem);

    // Add event listeners
    setupQuestionItemEvents(questionItem);
  }

  function setupQuestionItemEvents(questionItem) {
    // Delete question button
    const deleteBtn = questionItem.querySelector('.delete-question-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        questionItem.remove();
      });
    }

    // Question type change
    const typeSelect = questionItem.querySelector('.question-type-per-item');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        const newType = e.target.value;
        changeQuestionType(questionItem, newType);
      });
    }

    // Add option button for multiple choice
    const addOptionBtn = questionItem.querySelector('.add-option-btn');
    if (addOptionBtn) {
      addOptionBtn.addEventListener('click', () => {
        addOptionToQuestion(questionItem);
      });
    }

    // Remove option buttons
    const removeButtons = questionItem.querySelectorAll('.remove-option-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        removeOptionFromQuestion(e.target, questionItem);
      });
    });
  }

  function addOptionToQuestion(questionItem) {
    const optionsContainer = questionItem.querySelector('.multiple-choice-options');
    if (!optionsContainer) return;

    const optionCount = optionsContainer.children.length;
    const radioName = `correct-${Date.now()}`;
    
    const optionGroup = document.createElement('div');
    optionGroup.className = 'option-input-group';
    optionGroup.innerHTML = `
      <input type="radio" name="${radioName}" value="${optionCount}">
      <input type="text" class="option-input" placeholder="Option ${String.fromCharCode(65 + optionCount)}">
      <button class="remove-option-btn">×</button>
    `;

    optionsContainer.appendChild(optionGroup);

    // Add event listener for the new remove button
    const removeBtn = optionGroup.querySelector('.remove-option-btn');
    removeBtn.addEventListener('click', (e) => {
      removeOptionFromQuestion(e.target, questionItem);
    });
  }

  function removeOptionFromQuestion(button, questionItem) {
    const optionGroup = button.closest('.option-input-group');
    const optionsContainer = questionItem.querySelector('.multiple-choice-options');
    
    if (optionsContainer.children.length > 2) { // Keep at least 2 options
      optionGroup.remove();
      updateRadioValues(questionItem);
    } else {
      alert('You must have at least 2 options for a multiple choice question.');
    }
  }

  function updateRadioValues(questionItem) {
    const radioButtons = questionItem.querySelectorAll('input[type="radio"]');
    radioButtons.forEach((radio, index) => {
      radio.value = index;
    });
  }

  function changeQuestionType(questionItem, newType) {
    const questionInput = questionItem.querySelector('.question-input');
    const oldQuestion = questionInput ? questionInput.value : '';
    const index = Array.from(questionItem.parentNode.children).indexOf(questionItem);

    if (newType === 'multiple-choice') {
      questionItem.innerHTML = `
        <select class="question-type-per-item" data-index="${index}">
          <option value="multiple-choice" selected>Multiple Choice</option>
          <option value="true-false">True/False</option>
          <option value="fill-blank">Fill in the Blank</option>
          <option value="short-answer">Short Answer</option>
        </select>
        <input type="text" class="question-input" placeholder="What is the capital of France?" value="${oldQuestion}">
        <div class="multiple-choice-options">
          <div class="option-input-group">
            <input type="radio" name="correct-${Date.now()}" value="0" checked>
            <input type="text" class="option-input" placeholder="Option A" value="Option A">
            <button class="remove-option-btn">×</button>
          </div>
          <div class="option-input-group">
            <input type="radio" name="correct-${Date.now()}" value="1">
            <input type="text" class="option-input" placeholder="Option B" value="Option B">
            <button class="remove-option-btn">×</button>
          </div>
          <div class="option-input-group">
            <input type="radio" name="correct-${Date.now()}" value="2">
            <input type="text" class="option-input" placeholder="Option C" value="Option C">
            <button class="remove-option-btn">×</button>
          </div>
          <div class="option-input-group">
            <input type="radio" name="correct-${Date.now()}" value="3">
            <input type="text" class="option-input" placeholder="Option D" value="Option D">
            <button class="remove-option-btn">×</button>
          </div>
        </div>
        <button class="add-option-btn">+ Add Option</button>
        <button class="delete-question-btn">Delete Question</button>
      `;
    } else if (newType === 'true-false') {
      questionItem.innerHTML = `
        <select class="question-type-per-item" data-index="${index}">
          <option value="multiple-choice">Multiple Choice</option>
          <option value="true-false" selected>True/False</option>
          <option value="fill-blank">Fill in the Blank</option>
          <option value="short-answer">Short Answer</option>
        </select>
        <input type="text" class="question-input" placeholder="Example: The sky is blue." value="${oldQuestion}">
        <div class="true-false-options">
          <label><input type="radio" name="answer-${Date.now()}" value="true" checked> True</label>
          <label><input type="radio" name="answer-${Date.now()}" value="false"> False</label>
        </div>
        <button class="delete-question-btn">Delete</button>
      `;
    } else {
      questionItem.innerHTML = `
        <select class="question-type-per-item" data-index="${index}">
          <option value="multiple-choice">Multiple Choice</option>
          <option value="true-false">True/False</option>
          <option value="fill-blank" ${newType === 'fill-blank' ? 'selected' : ''}>Fill in the Blank</option>
          <option value="short-answer" ${newType === 'short-answer' ? 'selected' : ''}>Short Answer</option>
        </select>
        <input type="text" class="question-input" placeholder="Question" value="${oldQuestion}">
        <input type="text" class="answer-input" placeholder="Answer">
        <button class="delete-question-btn">Delete</button>
      `;
    }

    // Re-attach event listeners
    setupQuestionItemEvents(questionItem);
  }

  function saveQuiz() {
    const title = quizTitleInput.value.trim();
    const questions = getCurrentQuestions().filter(q => q.question.trim() && q.answer.trim());

    if (!title) {
      alert('Please enter a quiz title.');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question.');
      return;
    }

    const newQuiz = {
      title,
      questions,
      createdAt: new Date().toISOString()
    };

    customQuizzes.push(newQuiz);
    localStorage.setItem('customQuizzes', JSON.stringify(customQuizzes));

    alert('Quiz saved successfully!');
    quizTitleInput.value = '';
    questionsList.innerHTML = '';
    loadQuizOptions();
    loadFlashcardOptions();
  }

  // Event listeners
  addQuestionBtn.addEventListener('click', addQuestion);
  saveQuizBtn.addEventListener('click', saveQuiz);

  // Initialize
  switchMode('create');
  loadQuizOptions();
  updateStats();