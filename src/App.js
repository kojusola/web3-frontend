import "./App.css";
import Header from "./components/header/Header";
import MyStake from "./components/MyStake/MyStake";
import StakeHistory from "./components/StakeHistory/StakeHistory";
import { useState, useEffect, useCallback } from "react";
import Footer from "./components/Footer/Footer";
import { ethers, utils, Contract } from "ethers";
import BRTTokenAbi from "./utils/web3/abi.json";
// import WAValidator from "wallet-validator";
import WAValidator from "@swyftx/api-crypto-address-validator/dist/wallet-address-validator.min.js";
import { Buffer } from "buffer";
Buffer.from("anything", "base64");
const BRTTokenAddress = "0x169E82570feAc981780F3C48Ee9f05CED1328e1b";

function App() {
  // a flag for keeping track of whether or not a user is connected
  const [connected, setConnected] = useState(false);

  // connected user details
  const [userInfo, setUserInfo] = useState({
    matic_balance: 0,
    token_balance: 0,
    address: null,
  });

  // the amount of token the user have staked
  const [stakeAmount, setStakeAmount] = useState(0);

  // the amount of reward the user has accumulate on his stake
  const [rewardAmount, setRewardAmount] = useState(null);
  const [stakeAddressAmount, setStakeAddressAmount] = useState(0);

  // the value of token the user wants to stake
  const [stakeInput, setStakeInput] = useState("");

  // the value of token the user wants to withdraw
  const [withdrawInput, setWithdrawInput] = useState("");

  const [addressInput, setAddressInput] = useState("");

  // all stake history data displayed on the history table
  const [stateHistory, setStakeHistory] = useState([]);

  // helper function for getting the matic and token balance, given an address
  const getAccountDetails = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const userMaticBal = await provider.getBalance(address);
      const BRTContractInstance = new Contract(
        BRTTokenAddress,
        BRTTokenAbi,
        provider
      );
      const userBRTBalance = await BRTContractInstance.balanceOf(address);
      return { userBRTBalance, userMaticBal };
    } catch (err) {
      console.log(err);
    }
  };

  const getStakeBalance = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const BRTContractInstance = new Contract(
        BRTTokenAddress,
        BRTTokenAbi,
        signer
      );
      const stake = await BRTContractInstance.myStake();
      return { stake };
    } catch (err) {
      console.log(err);
    }
  };

  // handler for when user switch from one account to another or completely disconnected
  const handleAccountChanged = useCallback(async (accounts) => {
    if (!!accounts.length) {
      const networkId = await window.ethereum.request({
        method: "eth_chainId",
      });
      if (Number(networkId) !== 80001) return;
      const accountDetails = await getAccountDetails(accounts[0]);

      setUserInfo({
        matic_balance: accountDetails.userMaticBal,
        token_balance: accountDetails.userBRTBalance,
        address: accounts[0],
      });
      setConnected(true);
    } else {
      setConnected(false);
      setUserInfo({
        matic_balance: 0,
        token_balance: 0,
        address: null,
      });
    }
  }, []);

  // handler for handling chain/network changed
  const handleChainChanged = useCallback(async (chainid) => {
    if (Number(chainid) !== 80001) {
      setConnected(false);
      setUserInfo({
        matic_balance: 0,
        token_balance: 0,
        address: null,
      });

      return alert(
        "You are connected to the wrong network, please switch to polygon mumbai"
      );
    } else {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (!accounts.length) return;
      const accountDetails = await getAccountDetails(accounts[0]);
      setUserInfo({
        matic_balance: accountDetails.userMaticBal,
        token_balance: accountDetails.userBRTBalance,
        address: accounts[0],
      });
      setConnected(true);
    }
  }, []);

  // an handler to eagerly connect user and fetch their data
  const eagerConnect = useCallback(async () => {
    const networkId = await window.ethereum.request({ method: "eth_chainId" });
    if (Number(networkId) !== 80001) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (!accounts.length) return;
    const accountDetails = await getAccountDetails(accounts[0]);
    console.log(accountDetails);
    setUserInfo({
      matic_balance: accountDetails.userMaticBal,
      token_balance: accountDetails.userBRTBalance,
      address: accounts[0],
    });
    const stakeDetails = await await getStakeBalance();
    console.log(stakeDetails);
    setStakeAmount(Number(stakeDetails.stake[2].toString()) / 10 ** 18);
    const presentTime = new Date().getTime() / 1000;
    const stakeTime = Number(stakeDetails.stake[0].toString());
    if (presentTime - stakeTime > 259200 && !!stakeTime) {
      setRewardAmount((stakeAmount * 1.1) / 10 ** 18);
    } else setRewardAmount(0);
    setConnected(true);
  }, [stakeAmount]);

  // a function for fetching necesary data from the contract and also listening for contract event when the page loads
  const init = async () => {
    const customProvider = new ethers.providers.JsonRpcProvider(
      process.env.REACT_APP_RPC_URL
    );
    const BRTContractInstance = new Contract(
      BRTTokenAddress,
      BRTTokenAbi,
      customProvider
    );
    const stakeHistory = await BRTContractInstance.queryFilter("stakeEvent");

    const history = [];

    stakeHistory.forEach((data) => {
      history.unshift({
        amount: data.args[1],
        account: data.args[0],
        time: data.args[2].toString(),
        type: data.args[3],
      });
    });

    setStakeHistory(history);

    BRTContractInstance.on("stakeEvent", (account, amount, time, type) => {
      const newStake = {
        amount: amount,
        account: account,
        time: time.toString(),
        type: type,
      };

      setStakeHistory((prev) => [newStake, ...prev]);
    });
  };

  const stakeByAddress = async () => {
    const customProvider = new ethers.providers.JsonRpcProvider(
      process.env.REACT_APP_RPC_URL
    );
    const BRTContractInstance = new Contract(
      BRTTokenAddress,
      BRTTokenAbi,
      customProvider
    );
    return await BRTContractInstance.getStakeByAddress(addressInput);
  };

  useEffect(() => {
    init();
    if (!window.ethereum) return;
    // binding handlers to wallet events we care about
    window.ethereum.on("connect", eagerConnect);
    window.ethereum.on("accountsChanged", handleAccountChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
  }, [eagerConnect, handleAccountChanged, handleChainChanged]);

  const connectWallet = async () => {
    if (!!window.ethereum || !!window.web3) {
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } else {
      alert("please use an etherum enabled browser");
    }
  };

  // onchange handler for handling both stake and unstake input value
  const onChangeInput = ({ target }) => {
    switch (target.id) {
      case "stake":
        setStakeInput(target.value);
        break;

      case "unstake":
        setWithdrawInput(target.value);
        break;

      case "balance":
        setAddressInput(target.value);
        break;

      default:
        break;
    }
  };

  // A function that handles staking
  const onClickStake = async (e) => {
    e.preventDefault();
    if (stakeInput < 0) return alert("you cannot stake less than 0 BRT");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    if (stakeInput > userInfo.token_balance)
      return alert("You do not have enough Brt token to stake");
    const signer = provider.getSigner();
    const BRTContractInstance = new Contract(
      BRTTokenAddress,
      BRTTokenAbi,
      signer
    );
    const weiValue = utils.parseEther(stakeInput);
    const stakeTx = await BRTContractInstance.stakeBRT(weiValue);

    // const stakeTxHash = await provider.getTransaction(stakeTx.hash);
    await stakeTx.wait();

    // const address = response.events[1].args[0];
    // const amountStaked = response.events[1].args[1].toString();
    setStakeAmount((prev) => prev + Number(stakeInput));
  };

  const onClickWithdraw = async (e) => {
    e.preventDefault();
    if (stakeInput < 0) return alert("you cannot withdraw less than 0 BRT");
    if (stakeInput > stakeAmount + rewardAmount)
      return alert("You do not have enough to withdraw this amount");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const BRTContractInstance = new Contract(
      BRTTokenAddress,
      BRTTokenAbi,
      signer
    );
    const weiValue = utils.parseEther(withdrawInput);
    const stakeTx = await BRTContractInstance.withdraw(weiValue);

    // const stakeTxHash = await provider.getTransaction(stakeTx.hash);
    await stakeTx.wait();

    // const address = response.events[1].args[0];
    // const amountUnstaked = response.events[1].args[1].toString();
    setStakeAmount((prev) => prev - withdrawInput);
    // const time = response.events[1].args[2].toString();
  };
  const onClickBalance = async (e) => {
    e.preventDefault();
    const valid = WAValidator.validate(addressInput, "ETH");
    if (!valid) return alert("This is not a valid Ethereum Address");
    const amount = await stakeByAddress();
    setStakeAddressAmount(amount[2].toString());
  };

  return (
    <div className="App">
      <Header
        connectWallet={connectWallet}
        connected={connected}
        userInfo={userInfo}
      />
      <main className="main">
        <MyStake
          stakeInput={stakeInput}
          withdrawInput={withdrawInput}
          onChangeInput={onChangeInput}
          onClickStake={onClickStake}
          onClickWithdraw={onClickWithdraw}
          stakeAmount={stakeAmount}
          rewardAmount={rewardAmount}
          connected={connected}
          onClickBalance={onClickBalance}
          addressInput={addressInput}
          stakeAddressAmount={stakeAddressAmount}
        />
        <StakeHistory
          stakeData={stateHistory}
          onClickBalance={onClickBalance}
          addressInput={addressInput}
          onChangeInput={onChangeInput}
          stakeAddressAmount={stakeAddressAmount}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
