import {readFileSync} from 'node:fs';
import {sha256Canonical,semanticDecisionHash} from '../src/canonical.js';
import {treeHash} from '../src/assurance.js';
import {evaluate} from '../src/engine.js';
import {M0} from '../tests/fixtures/M0.js';

const receipt=JSON.parse(readFileSync('AGK-M0-CONFORMANCE-RECEIPT.json','utf8'));
const expectedReceiptHash=sha256Canonical(Object.fromEntries(Object.entries(receipt).filter(([k])=>k!=='receiptHash')));
if(receipt.receiptHash!==expectedReceiptHash) throw new Error(`Receipt hash mismatch: expected ${expectedReceiptHash}, got ${receipt.receiptHash}`);
if(receipt.specification!=='AGK-v1.0-rc1'||receipt.suite!=='AGK-M0') throw new Error('Receipt identity mismatch');
if(receipt.result?.gate!=='PASS'||receipt.result?.canonicalizationUnlocked!==false) throw new Error('Receipt result state is invalid');
if(receipt.execution?.totalTests!==10||receipt.execution?.replayIterationsPerTest!==1000) throw new Error('Receipt execution cardinality mismatch');
if(receipt.assurance?.policyVersion!=='AGK-v1.0-rc1') throw new Error('Policy version binding missing');
if(receipt.assurance?.implementationHash!==treeHash('src')) throw new Error('Implementation hash mismatch');
if(receipt.assurance?.fixturesHash!==sha256Canonical(M0)) throw new Error('Fixture hash mismatch');

const expectedViolation=(v:typeof M0[number])=>v.expect.forbid==='CANONICAL_INFERENCE'?['INV-AGK-11']:[];
const checks=M0.map(v=>{
 const r=evaluate(v.input); const e=v.expect as Record<string,unknown>; const positive:string[]=[]; const negative:string[]=[];
 if(e.tier!==undefined&&r.tier!==e.tier)positive.push('tier');
 if(e.gate!==undefined&&r.gateResult!==e.gate)positive.push('gate');
 if(e.mode!==undefined&&r.allowedMode!==e.mode)positive.push('mode');
 if(e.verification===true&&r.verificationContract?.isExecutable!==true)positive.push('verification');
 if(e.independence==='LOW'){const x=r.invariantResults.find(i=>i.invariantId==='INV-AGK-03');if(x?.status!=='ENFORCED_PASS'||!x.diagnostic?.includes('Repeated source identifiers'))positive.push('independence');}
 if(e.forbid==='MUTATION_REQUEST'&&r.decision.type==='MUTATION_REQUEST')negative.push('mutation');
 if(e.forbid==='CANONICAL_INFERENCE'&&r.invariantResults.find(i=>i.invariantId==='INV-AGK-11')?.status!=='VIOLATED')negative.push('canonical-inference');
 if(e.forbid==='TRUST_DECLARED_EFFECT'&&(r.tier==='R0'||r.gateResult!=='BLOCKED'||!r.blockers.includes('CLASSIFICATION_MISMATCH_FLAG')))negative.push('declared-effect');
 const actual=r.invariantResults.filter(x=>x.status==='VIOLATED').map(x=>x.invariantId); const unexpected=actual.filter(x=>!expectedViolation(v).includes(x));
 const unauthorized=r.decision.type==='MUTATION_REQUEST'&&!(v.expect.mode==='MUTATION_REQUEST'&&r.gateResult==='PASS');
 const mismatch=v.id==='M0-10'&&(r.tier!=='R4'||r.gateResult!=='BLOCKED'||!r.blockers.includes('CLASSIFICATION_MISMATCH_FLAG'));
 return {id:v.id,r,positive,negative,unexpected,unauthorized,mismatch};
});
const positiveFailures=checks.reduce((n,x)=>n+x.positive.length,0); const negativeFailures=checks.reduce((n,x)=>n+x.negative.length,0); const invariantViolations=checks.reduce((n,x)=>n+x.unexpected.length,0); const unauthorizedMutations=checks.filter(x=>x.unauthorized).length; const classificationBypasses=checks.filter(x=>x.mismatch).length;
if(receipt.execution.positiveFailures!==positiveFailures||receipt.execution.negativeFailures!==negativeFailures||receipt.execution.invariantViolations!==invariantViolations||receipt.execution.unauthorizedMutations!==unauthorizedMutations||receipt.execution.classificationBypasses!==classificationBypasses) throw new Error('Receipt assertion counters do not match independent evaluation');
const decisions=checks.map(x=>({id:x.id,semanticHash:semanticDecisionHash(x.r),nondeterministicRuns:0}));
if(receipt.assurance?.executionTraceHash!==sha256Canonical(checks.map(x=>({id:x.id,positiveFailures:x.positive,negativeFailures:x.negative,invariantResults:x.r.invariantResults,gateResults:x.r.gateResults,violations:x.r.violations,blockers:x.r.blockers,decision:x.r.decision,tier:x.r.tier,allowedMode:x.r.allowedMode,gateResult:x.r.gateResult,unexpectedInvariantViolations:x.unexpected,unauthorizedMutation:x.unauthorized,classificationBypass:x.mismatch})))) throw new Error('Execution trace hash mismatch');
if(receipt.assurance?.semanticDecisions===undefined||sha256Canonical(receipt.assurance.semanticDecisions)!==sha256Canonical(decisions)) throw new Error('Semantic decision set mismatch');
if(receipt.execution.nondeterministicRuns!==0) throw new Error('Receipt reports nondeterminism');
if(positiveFailures||negativeFailures||invariantViolations||unauthorizedMutations||classificationBypasses) throw new Error('Independent conformance evaluation failed');
console.log(`RECEIPT_VALID: ${receipt.receiptHash}`);
