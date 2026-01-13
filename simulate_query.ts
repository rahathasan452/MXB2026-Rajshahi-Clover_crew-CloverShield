
const searchParams = new URLSearchParams("txn=txn_12345");
const txnId = searchParams.get('txn');
console.log(`Transaction ID: ${txnId}`);
