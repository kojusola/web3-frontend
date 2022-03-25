import React from "react";
import { addressShortner, formatDate } from "../../utils/helpers";
import Styles from "./StakeHistory.module.css";
import clsx from "clsx";
import { utils } from "ethers";

const StakeHistory = ({
  stakeData,
  onClickBalance,
  addressInput,
  onChangeInput,
  stakeAddressAmount,
}) => {
  return (
    <div className={Styles.over}>
      <form onSubmit={onClickBalance} className={Styles.form}>
        <input
          type="text"
          placeholder="Address to check Stake"
          className={Styles.input}
          value={addressInput}
          onChange={onChangeInput}
          id="balance"
        />
        <button type="submit" className={Styles.bal_btn}>
          Check Stake
        </button>
        {stakeAddressAmount > 0 && (
          <p className={Styles.text}>{stakeAddressAmount / 10 ** 18} BRT</p>
        )}
      </form>
      <div className={Styles.root}>
        <table className={Styles.table}>
          <thead className={Styles.table_header}>
            <tr className={Styles.table__head_row}>
              <th className={Styles.table_head_data}>S/N</th>
              <th className={Styles.table_head_data}>Amount Staked</th>
              <th className={Styles.table_head_data}>Account</th>
              <th className={Styles.table_head_data}>Action</th>
              <th className={Styles.table_head_data}>Time</th>
            </tr>
          </thead>
          <tbody>
            {stakeData.map((item, index) => {
              return (
                <tr
                  key={index}
                  className={clsx({
                    [Styles.table_row]: true,
                    [Styles.unstake_style]: item.type === "unstake",
                    [Styles.stake_style]: item.type === "stake",
                  })}
                >
                  <td className={Styles.table_data}>{index + 1}</td>
                  <td className={Styles.table_data}>
                    {Number(utils.formatUnits(item.amount, 18)).toFixed(4)}
                  </td>
                  <td className={Styles.table_data}>
                    {addressShortner(item.account, false)}
                  </td>
                  <td className={Styles.table_data}>{item.type}</td>
                  <td className={Styles.table_data}>{formatDate(item.time)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StakeHistory;
