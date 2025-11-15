document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const playModeBtn = document.getElementById('play-mode-btn');
  const createModeBtn = document.getElementById('create-mode-btn');
  const flashcardModeBtn = document.getElementById('flashcard-mode-btn');
  const learnModeBtn = document.getElementById('learn-mode-btn');

  const playSection = document.getElementById('play-section');
  const createSection = document.getElementById('create-section');
  const flashcardSection = document.getElementById('flashcard-section');
  const learnSection = document.getElementById('learn-section');

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
  const flipCardBtn = document.getElementById('flip-card-btn');
  const prevCardBtn = document.getElementById('prev-card-btn');
  const nextCardBtn = document.getElementById('next-card-btn');
  const shuffleCardsBtn = document.getElementById('shuffle-cards-btn');
  const cardCounter = document.getElementById('card-counter');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');

  // Learn mode elements
  const learnQuizSelect = document.getElementById('learn-quiz-select');
  const learnProgressFill = document.getElementById('learn-progress-fill');
  const learnStats = document.getElementById('learn-stats');
  const learnQuestion = document.getElementById('learn-question');
  const learnOptions = document.getElementById('learn-options');
  const learnSubmitBtn = document.getElementById('learn-submit-btn');
  const learnFeedback = document.getElementById('learn-feedback');
  const learnFeedbackIcon = document.getElementById('learn-feedback-icon');
  const learnFeedbackText = document.getElementById('learn-feedback-text');
  const learnNextBtn = document.getElementById('learn-next-btn');

  // Create mode elements
  const quizTitleInput = document.getElementById('quiz-title');
  const questionTypeSelect = document.getElementById('question-type-select');
  const questionTypeDescription = document.getElementById('question-type-description');
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
  let currentCardIndex = 0;
  let isFlipped = false;

  // Learn mode state
  let learnCards = [];
  let learnCurrentIndex = 0;
  let learnMastered = 0;
  let learnTotal = 0;

  // Mode switching
  playModeBtn.addEventListener('click', () => switchMode('play'));
  createModeBtn.addEventListener('click', () => switchMode('create'));
  flashcardModeBtn.addEventListener('click', () => switchMode('flashcard'));
  learnModeBtn.addEventListener('click', () => switchMode('learn'));

  function switchMode(mode) {
    // Remove active class from all buttons
    [playModeBtn, createModeBtn, flashcardModeBtn, learnModeBtn].forEach(btn => {
      btn.classList.remove('active');
    });

    // Hide all sections
    [playSection, createSection, flashcardSection, learnSection].forEach(section => {
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
      case 'learn':
        learnModeBtn.classList.add('active');
        learnSection.classList.remove('hidden');
        loadLearnOptions();
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

  // Load quiz options for learn mode
  function loadLearnOptions() {
    learnQuizSelect.innerHTML = '<option value="">Select a quiz...</option>';
    customQuizzes.forEach((quiz, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = quiz.title;
      learnQuizSelect.appendChild(option);
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
      if (customQuizzes[quizIndex] && currentQuestionIndex < customQuizzes[quizIndex].questions.length) {
        currentQuestion = customQuizzes[quizIndex].questions[currentQuestionIndex];
        currentQuiz = customQuizzes[quizIndex].questions;
        displayQuestion(currentQuestion);
        resetTimer();
      } else {
        // Quiz finished
        showFinalResults();
      }
    }
  }

  function displayQuestion(question) {
    questionNumber.textContent = `Question ${currentQuestionIndex + 1}`;
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

    if (isCorrect) {
      score += calculatePoints();
      streak++;
      showFeedback(true, `Correct! +${calculatePoints()} points`);
    } else {
      streak = 0;
      showFeedback(false, `Incorrect. The answer was: ${correctAnswer}`);
    }

    updateStats();
    setTimeout(nextQuestion, 2000);
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
    currentQuestionIndex++;
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
    flashcardCards = [...quiz.questions];
    currentCardIndex = 0;
    isFlipped = false;

    shuffleCards();
    showCurrentCard();
  }

  function showCurrentCard() {
    if (flashcardCards.length === 0) return;

    const card = flashcardCards[currentCardIndex];
    flashcardQuestion.textContent = card.question;
    flashcardAnswer.textContent = card.answer || card.correctAnswer || 'No answer provided';

    flashcard.classList.remove('flipped');
    isFlipped = false;
    flipCardBtn.textContent = '👁️ Show Answer';

    cardCounter.textContent = `${currentCardIndex + 1} / ${flashcardCards.length}`;
  }

  flipCardBtn.addEventListener('click', () => {
    if (!isFlipped) {
      flashcard.classList.add('flipped');
      flipCardBtn.textContent = '🔄 Flip Back';
      isFlipped = true;
    } else {
      flashcard.classList.remove('flipped');
      flipCardBtn.textContent = '👁️ Show Answer';
      isFlipped = false;
    }
  });

  prevCardBtn.addEventListener('click', () => {
    if (currentCardIndex > 0) {
      currentCardIndex--;
      showCurrentCard();
    }
  });

  nextCardBtn.addEventListener('click', () => {
    if (currentCardIndex < flashcardCards.length - 1) {
      currentCardIndex++;
      showCurrentCard();
    }
  });

  shuffleCardsBtn.addEventListener('click', shuffleCards);

  function shuffleCards() {
    for (let i = flashcardCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flashcardCards[i], flashcardCards[j]] = [flashcardCards[j], flashcardCards[i]];
    }
    currentCardIndex = 0;
    showCurrentCard();
  }

  difficultyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const difficulty = parseInt(e.target.dataset.difficulty);
      // In a real implementation, this would affect spaced repetition
      console.log(`Card marked as difficulty: ${difficulty}`);
      nextCardBtn.click();
    });
  });

  // Learn mode functionality
  learnQuizSelect.addEventListener('change', loadLearnQuiz);

  function loadLearnQuiz() {
    const quizIndex = learnQuizSelect.value;
    if (quizIndex === '') return;

    const quiz = customQuizzes[parseInt(quizIndex)];
    learnCards = [...quiz.questions].map(card => ({
      ...card,
      mastered: false,
      difficulty: 1 // 1 = hard, 2 = medium, 3 = easy
    }));

    learnCurrentIndex = 0;
    learnMastered = 0;
    learnTotal = learnCards.length;

    updateLearnProgress();
    showLearnQuestion();
  }

  function showLearnQuestion() {
    if (learnCurrentIndex >= learnCards.length) {
      showLearnComplete();
      return;
    }

    const card = learnCards[learnCurrentIndex];
    learnQuestion.textContent = card.question;

    // Create multiple choice options
    const options = generateLearnOptions(card);
    learnOptions.innerHTML = '';

    options.forEach(option => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'learn-option';
      optionDiv.textContent = option;
      optionDiv.addEventListener('click', () => selectLearnAnswer(option, card));
      learnOptions.appendChild(optionDiv);
    });

    learnFeedback.classList.add('hidden');
  }

  function generateLearnOptions(correctCard) {
    const options = [correctCard.answer || correctCard.correctAnswer];
    const allAnswers = learnCards.map(card => card.answer || card.correctAnswer);

    // Add 3 random wrong answers
    while (options.length < 4 && allAnswers.length > options.length) {
      const randomAnswer = allAnswers[Math.floor(Math.random() * allAnswers.length)];
      if (!options.includes(randomAnswer)) {
        options.push(randomAnswer);
      }
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return options;
  }

  function selectLearnAnswer(selectedAnswer, correctCard) {
    const correctAnswer = correctCard.answer || correctCard.correctAnswer;
    const isCorrect = selectedAnswer === correctAnswer;

    // Update card difficulty based on answer
    if (isCorrect) {
      correctCard.difficulty = Math.min(3, correctCard.difficulty + 1);
      if (correctCard.difficulty >= 3) {
        correctCard.mastered = true;
        learnMastered++;
      }
    } else {
      correctCard.difficulty = Math.max(1, correctCard.difficulty - 1);
    }

    showLearnFeedback(isCorrect, correctAnswer);
    updateLearnProgress();
  }

  function showLearnFeedback(isCorrect, correctAnswer) {
    learnFeedback.className = `learn-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    learnFeedbackIcon.textContent = isCorrect ? '✅' : '❌';
    learnFeedbackText.textContent = isCorrect ?
      'Correct! Well done.' :
      `Incorrect. The answer was: ${correctAnswer}`;

    learnFeedback.classList.remove('hidden');
  }

  learnNextBtn.addEventListener('click', () => {
    learnCurrentIndex++;
    showLearnQuestion();
  });

  function updateLearnProgress() {
    const progress = (learnMastered / learnTotal) * 100;
    learnProgressFill.style.width = `${progress}%`;
    learnStats.textContent = `${learnMastered} / ${learnTotal} mastered`;
  }

  function showLearnComplete() {
    learnQuestion.textContent = '🎉 Congratulations!';
    learnOptions.innerHTML = '<div class="learn-option">You\'ve mastered all the cards in this quiz!</div>';
    learnFeedback.classList.add('hidden');
  }

  // Create quiz functionality
  function updateQuestionTypeDescription() {
    const questionType = questionTypeSelect.value;
    let description = '';

    switch(questionType) {
      case 'multiple-choice':
        description = '📝 Multiple choice questions - add as many options as you want!';
        break;
      case 'true-false':
        description = '✅ True or False questions - select the correct answer';
        break;
      case 'fill-blank':
        description = '📝 Fill in the blank - students type their answer';
        break;
      case 'short-answer':
        description = '✍️ Short answer questions - open-ended responses';
        break;
    }

    questionTypeDescription.textContent = description;
  }

  // Initialize question type description
  updateQuestionTypeDescription();

  // Update description when question type changes
  questionTypeSelect.addEventListener('change', updateQuestionTypeDescription);
  function renderQuestionsList() {
    questionsList.innerHTML = '';
    const questions = getCurrentQuestions();
    questions.forEach((q, index) => {
      const questionItem = document.createElement('div');
      questionItem.className = 'question-item';

      if (q.type === 'true-false') {
        questionItem.innerHTML = `
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
          <input type="text" class="question-input" placeholder="What is the capital of France?" value="${q.question || ''}">
          <div class="multiple-choice-options">
            ${optionsHtml}
          </div>
          <button class="add-option-btn">+ Add Option</button>
          <button class="delete-question-btn" data-index="${index}">Delete Question</button>
        `;
      } else {
        questionItem.innerHTML = `
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

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-question-btn[data-index]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        deleteQuestion(index);
      });
    });
  }

  function getCurrentQuestions() {
    return Array.from(document.querySelectorAll('.question-item')).map(item => {
      const question = item.querySelector('.question-input').value;
      const questionType = item.querySelector('.multiple-choice-options') ? 'multiple-choice' : 
                          item.querySelector('.true-false-options') ? 'true-false' : 
                          questionTypeSelect.value;

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
    const questionType = questionTypeSelect.value;
    const questionItem = document.createElement('div');
    questionItem.className = 'question-item';

    if (questionType === 'true-false') {
      questionItem.innerHTML = `
        <input type="text" class="question-input" placeholder="Example: The sky is blue.">
        <div class="true-false-options">
          <label><input type="radio" name="answer-${Date.now()}" value="true" checked> True</label>
          <label><input type="radio" name="answer-${Date.now()}" value="false"> False</label>
        </div>
        <button class="delete-question-btn">Delete</button>
      `;
    } else if (questionType === 'multiple-choice') {
      questionItem.innerHTML = `
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

  function deleteQuestion(index) {
    const questions = getCurrentQuestions();
    questions.splice(index, 1);
    renderQuestionsList();
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
    loadLearnOptions();
  }

  // Event listeners
  addQuestionBtn.addEventListener('click', addQuestion);
  saveQuizBtn.addEventListener('click', saveQuiz);

  // Initialize
  switchMode('play');
  loadQuizOptions();
  updateStats();
});