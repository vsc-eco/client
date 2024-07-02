import { DID } from "dids";
import {Client as HiveClient, HivemindAPI, PrivateKey} from '@hiveio/dhive'
import { KeychainSDK } from "keychain-sdk";
import { encodePayload } from 'dag-jose-utils'
import Axios from "axios";
import Ajv from 'ajv'
import { submitTxQuery } from "./queries";
import { TransactionContainerV2, TransactionDbType, TxSchema } from "./types";
import { getNonce } from "./utils";

let hiveClient = new HiveClient('https://api.hive.blog')


export function setHiveAPI(api: string | string[]) {
  hiveClient = new HiveClient(api)
}

class TxBuilder {

  setPayer(payer: string): this {

    return this;
  }

  /**
   * Not implemented in VSC network yet
   * @param name 
   * @param options 
   * @returns 
   */
  addIntent(name: string, options?: any): this {


    return this
  }

  /**
   * Not implemented in VSC network yet
   * @param name 
   * @returns 
   */
  removeIntent(name: string):this {

    return this
  }


  setOp():this {
    
    return this
  }

  asTx() {

  }
}

interface callContractTx {
  op: 'call_contract'
  action: string
  contract_id: string
  payload: any
}


type TransactionDataCommon = callContractTx 

export class vTransaction {
  signature: object | null
  txData: TransactionDataCommon | null
  cachedNonce: any;
  constructor() {
    this.txData = null;
  }


  async setTx(txData: TransactionDataCommon) {
    // if(!ajv.validate(TxSchema, txData)) {
    //   throw new Error('Invalid TX data')
    // }

    this.txData = txData
  }

  async sign(did: DID) {

  }
  
  async broadcast(client: vClient, options?: {cacheNonce?: boolean}) {
    if(!this.txData) {
      throw new Error('No TX specified!')
    }
    if(client._args.loginType === 'hive') {
      await hiveClient.broadcast.json({
        id: 'vsc.tx',
        required_auths: [client.hiveName],
        required_posting_auths: [],
        json: JSON.stringify({
          __t: 'vsc-tx',
          __v: '0.1',
          net_id: 'testnet/0bf2e474-6b9e-4165-ad4e-a0d78968d20c',
          headers: {

          },
          tx: this.txData
        })
      }, PrivateKey.fromString(client.secrets.active || client.secrets.posting))
    } else if(client._args.loginType === 'offchain') {

      if(!this.cachedNonce) {
        this.cachedNonce = await getNonce(client._did.id, `${client._args.api}/api/v1/graphql`)
      }

      const txData:TransactionContainerV2 = {
        __v: '0.2',
        __t: 'vsc-tx',
        headers: {
          type: TransactionDbType.input,
          nonce: this.cachedNonce,
          required_auths: [
            client._did.id
          ],
        },
        tx: this.txData
      }

      this.cachedNonce = this.cachedNonce + 1


      //Create JWS signed by DID
      const jws = await client._did.createDagJWS(txData)
      
      //Convert JWS into separate sig & tx data
      const protectedVal = JSON.parse(Buffer.from(jws.jws.signatures[0].protected,'base64url').toString())
      const did = protectedVal.kid.split('#')[0]
     
      const sigs = [
        {
          alg: protectedVal.alg,
          //Key id copy
          kid: did,
          sig: jws.jws.signatures[0].signature
        }
      ]
      const sigEncoded = Buffer.from((await encodePayload({
        __t: 'vsc-sig',
        sigs
      })).linkedBlock).toString('base64url')
      const encodedTx = Buffer.from(jws.linkedBlock).toString('base64url');

      // const convertJws = await convertTxJws({
      //   sig: sigEncoded,
      //   tx: encodedTx
      // });

      // const verifResult = await client._did.verifyJWS(convertJws.jws as any)
      const {data} = await Axios.post(`${client._args.api}/api/v1/graphql`, {
        query: submitTxQuery,
        variables: {
          tx: encodedTx,
          sig: sigEncoded
        }
      })
      console.log(data)
      if(data.data) {
        const submitResult = data.data.submitTransactionV1;
        console.log(submitResult)
      }
    }
  }
}

export interface vClientArgs {
  /**
   * Decide whether the VSC client should interact with hive on chain or offchain data.
   */
  loginType: 'hive' | 'offchain'

  /**
   * VSC API 
   */
  api: string
}

export class vClient {
  loggedIn: boolean
  _args: vClientArgs;
  _did: DID;
  secrets: {
    posting?: string
    active?: string
  }
  _keychain: KeychainSDK;
  hiveName: string;

  constructor(args: vClientArgs) {
    this.loggedIn = false;
    this._args = args;

    this.secrets = {

    }
  }

  async call() {

  }

  async login(did: DID) {
    if(this._args.loginType === 'hive') {
      throw new Error('args.loginType must be set to "offchain"')
    }
    if(!did.authenticated) {
      throw new Error('DID Not authenticated! Must run await did.authenticate()')
    }
    this._did = did;
  }

  async loginWithHive(args: {
    hiveName: string
    provider: 'hive_keychain' | 'direct'
    posting?: string
    active?: string
  }) {

    if(args.provider === 'hive_keychain') {
      if(!(window as any).hive_keychain) {
        throw new Error('Hive keychain not available')
      }
      this._keychain = new KeychainSDK(window);
      this.loggedIn = true
    } else if (args.provider === 'direct') {
      if(!args.posting && !args.active) {
        throw new Error('Missing posting or active key')
      }
      this.secrets.posting = args.posting
      this.secrets.active = args.active
      this.loggedIn = true
    } else {
      throw new Error('Invalid Provider')
    }
    this.hiveName = args.hiveName
  }
  
  async _sign() {

  }
}