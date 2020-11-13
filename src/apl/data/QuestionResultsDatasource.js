module.exports = (isCorrect, sessionAttributes, totalNumberOfQuestions, nextQuestionUserEventName) => {
  //TODO: Input validation and testing?
  return {
    isCorrect: isCorrect,
    nextQuestionUserEventName: nextQuestionUserEventName,
    sessionAttributes: sessionAttributes,
    totalNumberOfQuestions: totalNumberOfQuestions,
  };
};
