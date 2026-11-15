import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch} from '../shared/engine.js';
import {pumpQuizzes,answerQuiz,queueQuiz} from '../shared/quizzes.js';
import {quizFeedback} from '../public/quiz-feedback.js';
for(const key of [true,false])for(const selected of [true,false])test(`answer ${selected} to ${key}: points, unlock and feedback agree`,()=>{
 const m=createMatch([{id:'p',hero:'luna',team:0,slot:0}],[0,1]);const p=m.players[0];queueQuiz(p,'death');pumpQuizzes(m,[{id:'test',text:'Test',answer:key}]);const result=answerQuiz(m,p,p.quiz.index,selected),right=key===selected;
 assert.equal(result.isCorrect,right);assert.equal(result.correctAnswer,key);assert.equal(result.points>0,right);assert.equal(p.wallet>0,right);assert.equal(p.ultimate,right);assert.equal(p.correct,right?1:0);
 const feedback=quizFeedback({...result,ok:true},selected);assert.equal(feedback.state,right?'correct':'wrong');assert.match(feedback.text,right?/Bạn trả lời đúng/:/Bạn trả lời sai · \+0 điểm/);assert.match(feedback.text,new RegExp('Bạn chọn: '+(selected?'Đúng':'Sai')));assert.match(feedback.text,new RegExp('Đáp án: '+(key?'Đúng':'Sai')));assert.equal(answerQuiz(m,p,p.quiz.index,!selected),null);
});
test('errors and incomplete replies never appear correct',()=>{assert.equal(quizFeedback({ok:true},true).state,'error');assert.equal(quizFeedback({error:'Đã đóng'},false).state,'error');});
