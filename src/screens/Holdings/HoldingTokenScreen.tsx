import React from "react";
import i18n from "../../i18n";
import AppBar from "../../components/AppBar";
import HoldingsSection from "../../components/HoldingsSection";

const HoldingTokenScreen: React.FC = () => {
  return (
    <>
      <AppBar title={i18n.t("holdings.myFunds")} style={{ paddingHorizontal: 16 }} />
      <HoldingsSection />
    </>
  );
};

export default HoldingTokenScreen;