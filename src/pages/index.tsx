import React, { useEffect, useState } from "react";
import {
  createSmartAccountClient,
  BiconomySmartAccountV2,
  PaymasterMode,
} from "@biconomy/account";
import { ethers } from "ethers";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { contractABI } from "../contract/contractABI";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Transaction } from "@biconomy/account";


export default function Home() {
  const [smartAccount, setSmartAccount] =
    useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null
  );
  const [txAdd1, setTxAdd1] = useState<string>("");
  const [txAdd2, setTxAdd2] = useState<string>("");
  const [txnHash, setTxnHash] = useState<string | null>(null);
  const [chainSelected, setChainSelected] = useState<number>(0);

  const chains = [
    {
      chainId: 11155111,
      name: "Ethereum Sepolia",
      providerUrl: "https://eth-sepolia.public.blastapi.io",
      incrementCountContractAdd: "0xd9ea570eF1378D7B52887cE0342721E164062f5f",
      biconomyPaymasterApiKey: "gJdVIBMSe.f6cc87ea-e351-449d-9736-c04c6fab56a2",
      explorerUrl: "https://sepolia.etherscan.io/tx/",
    },
  ];

  const connect = async () => {
    try {
      const chainConfig = {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: "0xaa36a7",
        rpcTarget: chains[chainSelected].providerUrl,
        displayName: "Ethereum Sepolia",
        blockExplorer: "https://sepolia.etherscan.io/",
        ticker: "ETH",
        tickerName: "Ethereum",
      }


      //Creating web3auth instance
      const web3auth = new Web3Auth({
        clientId:
          "BExrkk4gXp86e9VCrpxpjQYvmojRSKHstPRczQA10UQM94S5FtsZcxx4Cg5zk58F7W1cAGNVx1-NPJCTFIzqdbs", // Get your Client ID from the Web3Auth Dashboard https://dashboard.web3auth.io/
        web3AuthNetwork: "sapphire_devnet", // Web3Auth Network
        chainConfig,
        uiConfig: {
          appName: "Biconomy X Web3Auth",
          mode: "dark", // light, dark or auto
          loginMethodsOrder: ["apple", "google", "twitter"],
          logoLight: "https://web3auth.io/images/web3auth-logo.svg",
          logoDark: "https://web3auth.io/images/web3auth-logo---Dark.svg",
          defaultLanguage: "en", // en, de, ja, ko, zh, es, fr, pt, nl
          loginGridCol: 3,
          primaryButton: "socialLogin", // "externalLogin" | "socialLogin" | "emailLogin"
        },
      });

      await web3auth.initModal();
      const web3authProvider = await web3auth.connect();
      const ethersProvider = new ethers.providers.Web3Provider(
        web3authProvider as any
      );
      const web3AuthSigner = ethersProvider.getSigner();

      const config = {
        biconomyPaymasterApiKey: chains[chainSelected].biconomyPaymasterApiKey,
        bundlerUrl: `https://bundler.biconomy.io/api/v2/${chains[chainSelected].chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`, // <-- Read about this at https://docs.biconomy.io/dashboard#bundler-url
      };

      const smartWallet = await createSmartAccountClient({
        signer: web3AuthSigner,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        bundlerUrl: config.bundlerUrl,
        rpcUrl: chains[chainSelected].providerUrl,
        chainId: chains[chainSelected].chainId,
      });

      console.log("Biconomy Smart Account", smartWallet);
      setSmartAccount(smartWallet);
      const saAddress = await smartWallet.getAccountAddress();
      console.log("Smart Account Address", saAddress);
      setSmartAccountAddress(saAddress);
    } catch (error) {
      console.error(error);
    }
  };

  const sendBatchTx = async () => {

    const txs: Transaction[] = [{ to: txAdd1, data: "0x123" }, { to: txAdd2, data: "0x234" }]
    if (smartAccount) {
      try {
        const userOpResponse = await smartAccount.sendTransaction(txs, { paymasterServiceData: { mode: PaymasterMode.SPONSORED }, });
        const { transactionHash } = await userOpResponse.waitForTxHash();
        console.log("Transaction Hash", transactionHash);
        const userOpReceipt = await userOpResponse.wait();
        if (userOpReceipt.success == 'true') {
          console.log("UserOp receipt", userOpReceipt)
          console.log("Transaction receipt", userOpReceipt.receipt)
        }
      } catch (error) {
        console.log(error);

      }

    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start gap-8 p-24">
      <div className="text-[3rem] font-bold text-orange-400">
        Biconomy-Web3Auth
      </div>
      {!smartAccount && (
        <>
          <div className="flex flex-row justify-center items-center gap-4">
            <div
              className={`w-[8rem] h-[3rem] cursor-pointer rounded-lg flex flex-row justify-center items-center text-white ${chainSelected == 0 ? "bg-orange-600" : "bg-black"
                } border-2 border-solid border-orange-400`}
              onClick={() => {
                setChainSelected(0);
              }}
            >
              Eth Sepolia
            </div>

          </div>
          <button
            className="w-[10rem] h-[3rem] bg-orange-300 text-black font-bold rounded-lg"
            onClick={connect}
          >
            Web3Auth Sign in
          </button>
        </>
      )}

      {smartAccount && (
        <>
          {" "}
          <span>Smart Account Address</span>
          <span>{smartAccountAddress}</span>
          <span>Network: {chains[chainSelected].name}</span>


          <div className="flex flex-col justify-center items-center gap-4">

            <div className="flex flex-col justify-center items-center">
              <input type="text" name="txAdd1" id="txAdd1" onChange={(e) => setTxAdd1(e.target.value)} className="mb-4 rounded-md bg-slate-300 p-2 text-black" />
              <input type="text" name="txAdd2" id="txAdd2" onChange={(e) => setTxAdd2(e.target.value)} className="mb-4 rounded-md bg-slate-300 p-2 text-black" />
              <button
                className="w-[10rem] h-[3rem] bg-orange-300 text-black font-bold rounded-lg"
                onClick={() => sendBatchTx()}
              >
                Send Batch Tx
              </button>
              {txnHash && (
                <a
                  target="_blank"
                  href={`${chains[chainSelected].explorerUrl + txnHash}`}
                >
                  <span className="text-white font-bold underline">
                    Txn Hash
                  </span>
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
