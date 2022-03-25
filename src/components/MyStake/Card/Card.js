import React from "react";
import Styles from "./Card.module.css";

const Card = ({ cardKey, cardValue }) => {
  return (
    <div className={Styles.root}>
      <span className={Styles.card_title}>{cardKey}</span>
      {cardValue > 0 && (
        <span className={Styles.card_value}>{cardValue} BRT</span>
      )}
      {cardValue === 0 && <span className={Styles.card_value}>-- : --</span>}
    </div>
  );
};

export default Card;
