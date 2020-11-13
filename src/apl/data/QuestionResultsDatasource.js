module.exports = (isCorrect, currentQuestionIndex, incorrectAnswers, score, skippedAnswers, totalNumberOfQuestions) => {
  //TODO: Input validation and testing?
  return {
    isCorrect: isCorrect,
    currentQuestionIndex: currentQuestionIndex,
    incorrectAnswers: incorrectAnswers,
    score: score,
    skippedAnswers: skippedAnswers,
    totalNumberOfQuestions: totalNumberOfQuestions,
  };
};
