module.exports = (isCorrect, currentQuestionIndex, incorrectAnswers, score, skipped, totalNumberOfQuestions) => {
  //TODO: Input validation and testing?
  return {
    isCorrect: isCorrect,
    currentQuestionIndex: currentQuestionIndex,
    incorrectAnswers: incorrectAnswers,
    score: score,
    skipped: skipped,
    totalNumberOfQuestions: totalNumberOfQuestions,
  };
};
