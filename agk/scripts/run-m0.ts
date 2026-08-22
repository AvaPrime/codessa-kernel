import {writeFileSync} from 'node:fs';
import {evaluate} from '../src/engine.js';
import {semanticDecisionHash,sha256Canonical} from '../src/canonical.js';
import {treeHash} from '../src/assurance.js';
import {M0} from '../tests/fixtures/M0.js';

const expectedViolationIds=(v:typeof M0[number]):string[]=>v.expect.forbid==='CANONICAL_INFERENCE'?['INV-AGK-11']:[];

function assertVector(v:typeof M0[number],r:ReturnType<typeof evaluate>){
 const e=v.expect as Record<string,unknown>;
 const positive:string[]=[];
 const negative:string[]=[];
 if(e.tier!==undefined && r.tier!==e.tier) positive.push(`tier expected ${String(e.tier)} got ${r.tier}`);
 if(e.gate!==undefined && r.gateResult!==e.gate) positive.push(`gate expected ${String(e.gate)} got ${r.gateResult}`);
 if(e.mode!==undefined && r.allowedMode!==e.mode) positive.push(`mode expected ${String(e.mode)} got ${r.allowedMode}`);
 if(e.verification===true && r.verificationContract?.isExecutable!==true) positive.push('executable verification contract missing');
 if(e.independence==='LOW'){
  const x=r.invariantResults.find(i=>i.invariantId==='INV-AGK-03');
  if(x?.status!=='ENFORCED_PASS' || !x.diagnostic?.includes('Repeated source identifiers')) positive.push('repetition did not remain low-independence');
 }
 if(e.forbid==='MUTATION_REQUEST' && r.decision.type==='MUTATION_REQUEST') negative.push('forbidden MUTATION_REQUEST emitted');
 if(e.forbid==='CANONICAL_INFERENCE' && r.invariantResults.find(i=>i.invariantId==='INV-AGK-11')?.status!=='VIOLATED') negative.push('canonical inference prohibition was not enforced');
 if(e.forbid==='TRUST_DECLARED_EFFECT' && (r.tier==='R0' || r.gateResult!=='BLOCKED' || !r.blockers.includes('CLASSIFICATION_MISMATCH_FLAG'))) negative.push('declared effect bypassed classification sovereignty');
 return {positive,negative};
}

const rows=M0.map(v=>{
 const first=evaluate(v.input);
 const assertions=assertVector(v,first);
 const semanticHash=semanticDecisionHash(first);
 let nondeterministicRuns=0;
 for(let i=0;i<1000;i++) if(semanticDecisionHash(evaluate(v.input))!==semanticHash) nondeterministicRuns++;
 const expectedViolations=expectedViolationIds(v);
 const actualViolations=first.invariantResults.filter(x=>x.status==='VIOLATED').map(x=>x.invariantId);
 const unexpectedInvariantViolations=actualViolations.filter(x=>!expectedViolations.includes(x));
 const unauthorizedMutation=first.decision.type==='MUTATION_REQUEST' && !(v.expect.mode==='MUTATION_REQUEST' && first.gateResult==='PASS');
 const classificationBypass=v.id==='M0-10' && (first.tier!=='R4'||first.gateResult!=='BLOCKED'||!first.blockers.includes('CLASSIFICATION_MISMATCH_FLAG'));
 return {id:v.id,positiveFailures:assertions.positive,negativeFailures:assertions.negative,invariantResults:first.invariantResults,gateResults:first.gateResults,violations:first.violations,blockers:first.blockers,decision:first.decision,tier:first.tier,allowedMode:first.allowedMode,gateResult:first.gateResult,semanticHash,nondeterministicRuns,unexpectedInvariantViolations,unauthorizedMutation,classificationBypass};
});

const adversarialIds=['M0-04','M0-05','M0-06','M0-07','M0-10'];
const adversarialResults=adversarialIds.map(id=>{const r=rows.find(x=>x.id===id)!; return {id,pass:r.positiveFailures.length===0&&r.negativeFailures.length===0&&r.unexpectedInvariantViolations.length===0&&!r.unauthorizedMutation&&!r.classificationBypass&&r.nondeterministicRuns===0};});
const positiveFailures=rows.reduce((n,r)=>n+r.positiveFailures.length,0);
const negativeFailures=rows.reduce((n,r)=>n+r.negativeFailures.length,0);
const invariantViolations=rows.reduce((n,r)=>n+r.unexpectedInvariantViolations.length,0);
const unauthorizedMutations=rows.filter(r=>r.unauthorizedMutation).length;
const classificationBypasses=rows.filter(r=>r.classificationBypass).length;
const nondeterministicRuns=rows.reduce((n,r)=>n+r.nondeterministicRuns,0);
const gate=positiveFailures===0&&negativeFailures===0&&invariantViolations===0&&unauthorizedMutations===0&&classificationBypasses===0&&nondeterministicRuns===0&&adversarialResults.every(x=>x.pass)?'PASS':'FAIL';

const semanticDecisions=rows.map(({id,semanticHash,nondeterministicRuns})=>({id,semanticHash,nondeterministicRuns}));
const executionTrace=rows.map(({id,invariantResults,gateResults,violations,blockers,decision,tier,allowedMode,gateResult,positiveFailures,negativeFailures,unexpectedInvariantViolations,unauthorizedMutation,classificationBypass})=>({id,positiveFailures,negativeFailures,invariantResults,gateResults,violations,blockers,decision,tier,allowedMode,gateResult,unexpectedInvariantViolations,unauthorizedMutation,classificationBypass}));
const receipt:any={receiptVersion:'1.0',specification:'AGK-v1.0-rc1',suite:'AGK-M0',execution:{totalTests:10,positiveFailures,negativeFailures,invariantViolations,unauthorizedMutations,classificationBypasses,nondeterministicRuns,replayIterationsPerTest:1000},result:{gate,canonicalizationUnlocked:false,nextMilestone:'AGK-M1'},assurance:{policyVersion:'AGK-v1.0-rc1',policyHash:sha256Canonical('AGK-v1.0-rc1'),implementationHash:treeHash('src'),fixturesHash:sha256Canonical(M0),executionTraceHash:sha256Canonical(executionTrace),semanticDecisions,adversarialResults}};
receipt.receiptHash=sha256Canonical(receipt);
writeFileSync('AGK-M0-CONFORMANCE-RECEIPT.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
if(gate!=='PASS') process.exitCode=1;
