const {
  SWIPE,
  TAP, } = require("constants/ResponseModes");

module.exports = (data) => {
  //TODO: Input validation and testing?
  const answers = data.answers;

  return {
    type: "object",
    objectId: "questionAndAnswersDatasourceId",
    question: `${data.question}`,
    correctAnswerIndex: data.sessionAttributes.correctAnswerIndex,
    answers: answers,
    sessionAttributes: data.sessionAttributes,
    TAP_ANSWER_EVENT: TAP,
    SWIPE_ANSWER_EVENT: SWIPE,
    listItems: [
      {
        primaryText: `${answers[0].answerText}`,
      },
      {
        primaryText: `${answers[1].answerText}`,
      },
      {
        primaryText: `${answers[2].answerText}`,
      },
      {
        primaryText: `${answers[3].answerText}`,
      }
    ]
  };
};
