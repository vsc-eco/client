
export enum TransactionDbType {
    null,
    input,
    output,
    virtual,
    core,
    anchor_ref,
}


export enum TransactionIntent {
    'money.spend' = 'money.spend'
}

export interface TransactionContainerV2 {
    __t: 'vsc-tx'
    __v: '0.2'
    headers: {
        payer?: string
        lock_block?: string
        required_auths: Array<{
            type: 'active' | 'posting',
            value: string
        }>
        //Tuple of transaction intent enum and arguments as querystring
        intents: null | Array<[TransactionIntent, string]> 
    }
    tx: { 
        op: string
        payload: any // cid of ContractInput, ContractOutput or ContractUpdate and so on..
        type: TransactionDbType
    }
}