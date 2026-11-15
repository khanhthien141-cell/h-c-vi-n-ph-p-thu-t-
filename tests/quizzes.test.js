import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,attack,step,spawn,award} from '../shared/engine.js';
import {pumpQuizzes,answerQuiz,publicQuiz,queueQuiz} from '../shared/quizzes.js';
const players=[{id:'a',name:'A',team:0,slot:0,hero:'sol'},{id:'b',name:'B',team:1,slot:0,hero:'luna'}];
const bank=[{id:'q1',text:'Câu đúng',answer:true},{id:'q2',text:'Câu sai',answer:false}];
const make=()=>{const m=createMatch(players,[0,1]);m.players[0].x=0;m.players[0].z=0;m.players[1].x=1;m.players[1].z=0;return m;};
test('no periodic questions, kill alone levels up and triggers personal death/level questions',()=>{
 const m=make(),[a,b]=m.players;for(let i=0;i<70;i++){m.time=i;pumpQuizzes(m,bank);}assert.equal(a.quiz,null);assert.equal(b.quiz,null);
 b.hp=1;attack(m,a,0);assert.equal(a.level,2);assert.equal(b.dead,10);const delivered=[];pumpQuizzes(m,bank,(p,q)=>delivered.push([p.id,q.reason]));assert.deepEqual(delivered,[['a','levelup'],['b','death']]);assert.equal(publicQuiz(b.quiz).answer,undefined);
 answerQuiz(m,b,b.quiz.index,b.quiz.answer);assert.equal(b.level,1);assert.equal(b.ultimate,true);assert.equal(answerQuiz(m,b,b.quiz.index,true),null);spawn(b,1);assert.equal(b.ultimate,true);assert.equal(b.level,1);
});
test('timeout does not block respawn or grant levels, and a used question is not reused before its bank is exhausted',()=>{
 const m=make(),p=m.players[1];p.dead=10;queueQuiz(p,'death');pumpQuizzes(m,bank);const id=p.quiz.questionId;step(m,10.01);pumpQuizzes(m,bank);assert.equal(p.dead,0);assert.equal(p.level,1);assert.equal(p.quiz.resolved,true);assert.equal(answerQuiz(m,p,p.quiz.index,true),null);
 m.time+=2.1;queueQuiz(p,'death');pumpQuizzes(m,bank);assert.notEqual(p.quiz.questionId,id);
});
test('death during a level-up question combines contexts instead of opening two dialogs',()=>{
 const m=make(),p=m.players[0];p.level=2;queueQuiz(p,'levelup');pumpQuizzes(m,bank);const index=p.quiz.index;m.time=4;p.dead=10;queueQuiz(p,'death');pumpQuizzes(m,bank);assert.equal(p.quiz.index,index);assert.equal(p.quiz.reason,'death+levelup');assert.equal(p.quiz.at,4);assert.equal(p.quizTriggers.length,0);
});
test('maximum level does not grow and answering correctly cannot level a player',()=>{
 const m=make(),[a,b]=m.players;a.level=10;b.hp=1;attack(m,a,0);assert.equal(a.level,10);assert.equal(a.quizTriggers.length,0);const before=b.level;award(m,b,99,true,true,1);assert.equal(b.level,before);
});
test('no repeated question across players or after exhaustion, including duplicate text IDs',()=>{const m=make(),seen=[];const b=[...bank,{...bank[0],id:'duplicate',text:'  Câu đúng  '}];for(let i=0;i<8;i++){for(const p of m.players){p.quiz=null;queueQuiz(p,'death');}pumpQuizzes(m,b,(p,q)=>seen.push(q.text.trim()));m.time+=20;}assert.equal(seen.length,2);assert.equal(new Set(seen).size,2);assert.ok(m.players.every(p=>!p.quiz&&p.quizTriggers.length===0));});
