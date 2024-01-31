
export const submitTx = `
query SubmitTx($sig: String, $tx: String) {
    submitTx(sig: $sig, $tx: String) {
        id
    }
}
`

export const getNonce = `
qeury GetNonce($keyGroup: [String]) {
    getAccountNonce(keyGroup: $keyGroup) {
        nonce
    }
}
`