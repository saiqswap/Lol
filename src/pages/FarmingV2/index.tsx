/** @format */

import React, { useState, useEffect } from "react";
import { Box, Flex, Text } from "@chakra-ui/layout";
import {
  Alert,
  AlertDescription,
  CloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Button,
  useMediaQuery,
  Stack,
  Divider,
  Link,
} from "@chakra-ui/react";
import { useHistory } from "react-router-dom";
import { useColorModeValue } from "@chakra-ui/react";
import YieldFarm from "./YieldFarm";
// import { contents } from './mock'
import { AlertSvg } from "./Icon";
import { useRouteMatch } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import bigNumber from "bignumber.js";
import { ethers } from "ethers";
import {
  updateTokenStaked,
  updateTotalLiquidity,
  updateFarmBalances,
  updatePoolId,
} from "../../state/farm/actions";
import { useFarms } from "../../state/farm/hooks";
import {
  MasterChefV2Contract,
  smartSwapLPTokenPoolOne,
  smartSwapLPTokenPoolThree,
  smartSwapLPTokenPoolTwo,
  smartSwapLPTokenV2PoolFive,
  smartSwapLPTokenV2PoolFour,
  RGPSpecialPool,
  smartSwapLPTokenV2,
  rigelToken,
} from "../../utils/Contracts";
import {
  RGPADDRESSES,
  RGPSPECIALPOOLADDRESSES,
  MASTERCHEFV2ADDRESSES,
  SMARTSWAPLP_TOKEN1ADDRESSES,
  SMARTSWAPLP_TOKEN2ADDRESSES,
  SMARTSWAPLP_TOKEN3ADDRESSES,
  SMARTSWAPLP_TOKEN4ADDRESSES,
  SMARTSWAPLP_TOKEN5ADDRESSES,
  RGP,
} from "../../utils/addresses";
import { formatBigNumber } from "../../utils";
import { RootState } from "../../state";
import { SupportedChainId } from "../../constants/chains";
import { useNativeBalance } from "../../utils/hooks/useBalances";
import { useActiveWeb3React } from "../../utils/hooks/useActiveWeb3React";

export const BIG_TEN = new bigNumber(10);

export const LIQUIDITY = "liquidity";
export const STAKING = "staking";
export const OTHER_FARMS = "other farms";
export const V1 = "v1";
export const V2 = "v2";
export const LIGHT_THEME = "light";
export const DARK_THEME = "dark";
export const LIQUIDITY_INDEX = 0;
export const STAKING_INDEX = 1;
export const MAINNET = 56;

export function Index() {
  const history = useHistory();
  const mode = useColorModeValue(LIGHT_THEME, DARK_THEME);
  const [selected, setSelected] = useState(LIQUIDITY);
  const [isActive, setIsActive] = useState(V2);
  const [showAlert, setShowAlert] = useState(true);
  const [farmDataLoading, setfarmDataLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [switchTab, setSwitchTab] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [liquidityIndex, setLiquidityIndex] = useState(0);
  const [stakingIndex, setStakingIndex] = useState(1);
  const [isMobileDevice] = useMediaQuery("(max-width: 750px)");

  const handleTabsChange = (index: number) => {
    const useIndex =
      index === 0 ? liquidityIndex : index === 1 ? stakingIndex : index;
    setTabIndex(useIndex);
  };

  const goToV1 = (index: number) => {
    setTabIndex(index);
  };

  const handleStakingTab = (event: { target: { value: string } }) => {
    setStakingIndex(parseInt(event.target.value, 10));
    setTabIndex(parseInt(event.target.value, 10));
  };

  const handleLiquidityTab = (event: { target: { value: string } }) => {
    setLiquidityIndex(parseInt(event.target.value, 10));
    setTabIndex(parseInt(event.target.value, 10));
  };

  //const { data: farmsLP } = useFarms()
  // const [farms, setFarms] = useState(contents);
  const { account, chainId, library } = useActiveWeb3React();
  const dispatch = useDispatch();
  let match = useRouteMatch("/farming-V2/staking-RGP");
  const FarmData = useFarms();

  const [Balance, Symbol] = useNativeBalance();
  const wallet = {
    balance: Balance,
    address: account,
    provider: library,
    signer: library?.getSigner(),
    chainId: chainId,
  };

  const trxState = useSelector<RootState>(
    (state) => state.application.modal?.trxState
  );
  const stateChanged: boolean = trxState === 2;

  //temporary
  useEffect(() => {
    getFarmData();
    getTokenStaked();
    getFarmTokenBalance();
  }, [account, chainId, stateChanged]);

  const refreshData = () => {
    getFarmData();
    getTokenStaked();
    getFarmTokenBalance();
  };

  useEffect(() => {
    refreshData();
  }, []);
  useEffect(() => {
    if (match) setSelected(STAKING);
  }, [match]);

  const changeVersion = (version: string, external?: boolean) => {
    if (external) {
      window.open(version);
    }
    history.push(version);
  };

  const handleSelect = (value: string) => {
    if (value === LIQUIDITY) {
      setSwitchTab(!switchTab);
      setSelected(LIQUIDITY);
      changeVersion("/farming-v2");
    } else if (value === STAKING) {
      setSwitchTab(!switchTab);
      setSelected(STAKING);
      changeVersion("/farming-v2/staking-RGP");
    } else {
      setSwitchTab(false);
    }
  };

  const handleActive = (value: string) => {
    if (value === V1) {
      setIsActive(V1);
      changeVersion("https://smartswap.rigelprotocol.com/farming", true);
    } else if (value === V2) {
      setIsActive(V2);
      changeVersion("/farming-v2");
    }
  };

  const showProject = () => {
    changeVersion(
      "https://docs.google.com/forms/d/e/1FAIpQLSdJGAuABrJd6d0WSprUWB140we9hGqa-IwIbonx9ZJhxN2zsg/viewform",
      true);
  }

  const handleAlert = () => {
    setShowAlert(false);
  };

  const getFarmTokenBalance = async () => {
    if (account) {
      try {
        if (Number(chainId) === Number(SupportedChainId.POLYGON)) {
          const [RGPToken, poolOne, poolTwo, poolThree] = await Promise.all([
            rigelToken(RGP[chainId as number], library),
            smartSwapLPTokenPoolOne(
              SMARTSWAPLP_TOKEN1ADDRESSES[chainId as number],
              library
            ),
            smartSwapLPTokenPoolTwo(
              SMARTSWAPLP_TOKEN2ADDRESSES[chainId as number],
              library
            ),
            smartSwapLPTokenPoolThree(
              SMARTSWAPLP_TOKEN3ADDRESSES[chainId as number],
              library
            ),
            // smartSwapLPTokenV2PoolFour(
            //   SMARTSWAPLP_TOKEN4ADDRESSES[chainId as number],
            //   library
            // ),
            // smartSwapLPTokenV2PoolFive(
            //   SMARTSWAPLP_TOKEN5ADDRESSES[chainId as number],
            //   library
            // ),
          ]);

          const [RGPbalance, poolOneBalance, poolTwoBalance, poolThreeBalance] =
            await Promise.all([
              RGPToken.balanceOf(account),
              poolOne.balanceOf(account),
              poolTwo.balanceOf(account),
              poolThree.balanceOf(account),
            ]);

          dispatch(
            updateFarmBalances([
              formatBigNumber(RGPbalance),
              formatBigNumber(poolOneBalance),
              formatBigNumber(poolTwoBalance),
              formatBigNumber(poolThreeBalance),
              // formatBigNumber(poolFourBalance),
              // formatBigNumber(poolFiveBalance),
            ])
          );
          dispatch(updatePoolId([0, 1, 2, 3]));
        } else {
          const [RGPToken, poolOne, poolTwo, poolThree, poolFour, poolFive] =
            await Promise.all([
              rigelToken(RGP[chainId as number], library),
              smartSwapLPTokenPoolOne(
                SMARTSWAPLP_TOKEN1ADDRESSES[chainId as number],
                library
              ),
              smartSwapLPTokenPoolTwo(
                SMARTSWAPLP_TOKEN2ADDRESSES[chainId as number],
                library
              ),
              smartSwapLPTokenPoolThree(
                SMARTSWAPLP_TOKEN3ADDRESSES[chainId as number],
                library
              ),
              smartSwapLPTokenV2PoolFour(
                SMARTSWAPLP_TOKEN4ADDRESSES[chainId as number],
                library
              ),
              smartSwapLPTokenV2PoolFive(
                SMARTSWAPLP_TOKEN5ADDRESSES[chainId as number],
                library
              ),
            ]);

          const [
            RGPbalance,
            poolOneBalance,
            poolTwoBalance,
            poolThreeBalance,
            poolFourBalance,
            poolFiveBalance,
          ] = await Promise.all([
            RGPToken.balanceOf(account),
            poolOne.balanceOf(account),
            poolTwo.balanceOf(account),
            poolThree.balanceOf(account),
            poolFour.balanceOf(account),
            poolFive.balanceOf(account),
          ]);

          dispatch(
            updateFarmBalances([
              formatBigNumber(RGPbalance),
              formatBigNumber(poolTwoBalance),
              formatBigNumber(poolOneBalance),
              formatBigNumber(poolThreeBalance),
              formatBigNumber(poolFourBalance),
              formatBigNumber(poolFiveBalance),
            ])
          );
        }
      } catch (error) {
        console.error(error, "getFarmTokenBalance => Farminv2");
      }
    }
  };

  const getFarmData = async () => {
    setfarmDataLoading(true);

    try {
      const deposit = async (token0: any, token1: any) => {
        let sym0 = await (
          await smartSwapLPTokenV2(await token0(), library)
        ).symbol();
        let sym1 = await (
          await smartSwapLPTokenV2(await token1(), library)
        ).symbol();
        if (sym0 === "WMATIC") sym0 = "MATIC";
        if (sym1 === "WMATIC") sym1 = "MATIC";
        return `${sym0}-${sym1}`;
      };

      //maticRGP
      //  console.log(pool1Reserve, pool2Reserve, pool3Reserve, pool4Reserve, pool5Reserve)

      // if (Number(chainId) === Number(SupportedChainId.POLYGONTEST)) {

      //maticRGP
      //  console.log(pool1Reserve, pool2Reserve, pool3Reserve, pool4Reserve, pool5Reserve)

      if (Number(chainId) === Number(SupportedChainId.POLYGONTEST)) {
        const [specialPool, pool1, pool2, pool3, pool4, pool5] =
          await Promise.all([
            RGPSpecialPool(RGPSPECIALPOOLADDRESSES[chainId as number], library),
            smartSwapLPTokenPoolOne(
              SMARTSWAPLP_TOKEN1ADDRESSES[chainId as number],
              library
            ),
            smartSwapLPTokenPoolTwo(
              SMARTSWAPLP_TOKEN2ADDRESSES[chainId as number],
              library
            ),
            smartSwapLPTokenPoolThree(
              SMARTSWAPLP_TOKEN3ADDRESSES[chainId as number],
              library
            ),
            smartSwapLPTokenV2PoolFour(
              SMARTSWAPLP_TOKEN4ADDRESSES[chainId as number],
              library
            ),
            smartSwapLPTokenV2PoolFive(
              SMARTSWAPLP_TOKEN5ADDRESSES[chainId as number],
              library
            ),
          ]);

        const [
          rgpTotalStaking,
          pool1Reserve,
          pool2Reserve,
          pool3Reserve,
          pool4Reserve,
          pool5Reserve,
        ] = await Promise.all([
          await specialPool.totalStaking(),
          pool1.getReserves(),
          pool2.getReserves(),
          pool3.getReserves(),
          pool4.getReserves(),
          pool5.getReserves(),
        ]);
        const MRGPprice: number | any = ethers.utils.formatUnits(
          pool3Reserve[1].mul(1000).div(pool3Reserve[0]),
          3
        );
        const getMaticPrice = (): number => {
          let MaticPrice;
          MaticPrice = ethers.utils.formatUnits(
            pool5Reserve[0].mul(1000).div(pool5Reserve[1]),
            3
          );

          return Number(MaticPrice);
        };
        const MaticPrice = getMaticPrice();
        const MRGPLiquidity = ethers.utils
          .formatUnits(rgpTotalStaking.mul(Math.floor(1000 * MRGPprice)), 21)
          .toString();

        const RGP_WMATICLiquidity = ethers.utils
          .formatUnits(
            pool1Reserve[0].mul(Math.floor(MaticPrice * 1000 * 2)),
            21
          )
          .toString();

        const USDT_RGPLiquidity = ethers.utils
          .formatEther(pool2Reserve[0].mul(Number(MRGPprice) * 1000 * 2))
          .toString();

        const RGP_USDCLiquidity = ethers.utils
          .formatEther(pool3Reserve[1].mul(Number(MRGPprice) * 1000 * 2))
          .toString();

        const USDT_WMATICLiquidity = ethers.utils
          .formatEther(pool4Reserve[1].mul(Number(MaticPrice) * 1000 * 2))
          .toString();

        const WMATIC_USDCLiquidity = ethers.utils
          .formatEther(pool5Reserve[1].mul(Number(MaticPrice) * 1000 * 2))
          .toString();

        dispatch(
          updateTotalLiquidity([
            {
              deposit: "RGP",
              liquidity: MRGPLiquidity,
              apy: calculateApy(MRGPprice, MRGPLiquidity, 250),
            },
            {
              deposit: await deposit(pool1.token0, pool1.token1),
              liquidity: RGP_WMATICLiquidity,
              apy: calculateApy(MRGPprice, RGP_WMATICLiquidity, 1116.25),
            },
            {
              deposit: await deposit(pool2.token0, pool2.token1),
              liquidity: USDT_RGPLiquidity,
              apy: calculateApy(MRGPprice, USDT_RGPLiquidity, 781.375),
            },
            {
              deposit: await deposit(pool3.token0, pool3.token1),
              liquidity: RGP_USDCLiquidity,
              apy: calculateApy(MRGPprice, RGP_USDCLiquidity, 781.375),
            },
            {
              deposit: await deposit(pool4.token0, pool4.token1),
              liquidity: USDT_WMATICLiquidity,
              apy: calculateApy(MRGPprice, USDT_WMATICLiquidity, 334.875),
            },
            {
              deposit: await deposit(pool5.token0, pool5.token1),
              liquidity: WMATIC_USDCLiquidity,
              apy: calculateApy(MRGPprice, WMATIC_USDCLiquidity, 334.875),
            },
          ])
        );
      } else if (Number(chainId) === Number(SupportedChainId.POLYGON)) {
        const [pool1, pool2, pool3] = await Promise.all([
          // RGPSpecialPool(RGPSPECIALPOOLADDRESSES[chainId as number]),
          smartSwapLPTokenPoolOne(
            SMARTSWAPLP_TOKEN1ADDRESSES[chainId as number],
            library
          ),
          smartSwapLPTokenPoolTwo(
            SMARTSWAPLP_TOKEN2ADDRESSES[chainId as number],
            library
          ),
          smartSwapLPTokenPoolThree(
            SMARTSWAPLP_TOKEN3ADDRESSES[chainId as number],
            library
          ),
          // smartSwapLPTokenV2PoolFour(
          //   SMARTSWAPLP_TOKEN4ADDRESSES[chainId as number], library
          // ),
          // smartSwapLPTokenV2PoolFive(
          //   SMARTSWAPLP_TOKEN5ADDRESSES[chainId as number], library
          // ),
        ]);

        const [
          // rgpTotalStaking,
          pool1Reserve,
          pool2Reserve,
          pool3Reserve,
          // pool4Reserve,
          // pool5Reserve,
        ] = await Promise.all([
          // await specialPool.totalStaking(),
          pool1.getReserves(),
          pool2.getReserves(),
          pool3.getReserves(),
          // pool4.getReserves(),
          // pool5.getReserves(),
        ]);

        const totalUSDT2: number | any = ethers.utils.formatUnits(
          pool2Reserve[1],
          6
        );
        const totalRGP2: number | any = ethers.utils.formatUnits(
          pool2Reserve[0],
          18
        );
        const totalRGP1: number | any = ethers.utils.formatUnits(
          pool1Reserve[1],
          18
        );
        const totalRGP3: number | any = ethers.utils.formatUnits(
          pool3Reserve[1],
          18
        );
        const rgpPrice = totalUSDT2 / totalRGP2;
        const RGP_USDTLiq = totalUSDT2 * 2;
        console.log(RGP_USDTLiq);
        const RGP_WMATICLiquidity = Number(totalRGP1) * Number(rgpPrice) * 2;
        const USDC_RGPLiq = totalRGP3 * rgpPrice * 2;
        // const USDT_RGPLiquidity = ethers.utils.formatUnits(
        console.log({ rgpPrice });
        //   pool2Reserve[1].div(1000).mul(2),
        //   3
        // );

        // const RGP_USDCLiquidity = ethers.utils.formatUnits(
        //   pool3Reserve[0].div(1000).mul(2),
        //   3
        // );

        // const USDT_WMATICLiquidity = ethers.utils
        //   .formatEther(pool4Reserve[1].mul(Number(MaticPrice) * 1000 * 2))
        //   .toString();

        // const WMATIC_USDCLiquidity = ethers.utils
        //   .formatEther(pool5Reserve[1].mul(Number(MaticPrice) * 1000 * 2))
        //   .toString();

        dispatch(
          updateTotalLiquidity([
            {
              deposit: "RGP",
              liquidity: "0", // MRGPLiquidity,
              apy: "0", // calculateApy(MRGPprice, MRGPLiquidity, 250),
            },
            {
              deposit: await deposit(pool1.token0, pool1.token1),
              liquidity: RGP_WMATICLiquidity,
              apy: calculateApy(rgpPrice, RGP_WMATICLiquidity, 1500),
            },
            {
              deposit: await deposit(pool2.token0, pool2.token1),
              liquidity: RGP_USDTLiq,
              apy: calculateApy(rgpPrice, RGP_USDTLiq, 1050),
            },
            {
              deposit: "RGP-USDC", //await deposit(pool3.token0, pool3.token1),
              liquidity: USDC_RGPLiq,
              apy: calculateApy(rgpPrice, USDC_RGPLiq, 1050),
            },
            // {
            //   deposit: "USDT - MATIC", // await deposit(pool4.token0, pool4.token1),
            //   liquidity: 0, //USDT_WMATICLiquidity,
            //   apy: "0" // calculateApy(MRGPprice, USDT_WMATICLiquidity, 334.875),
            // },
            // {
            //   deposit: "MATIC - USDC", // await deposit(pool5.token0, pool5.token1),
            //   liquidity: 0, //WMATIC_USDCLiquidity,
            //   apy: "0" // calculateApy(MRGPprice, WMATIC_USDCLiquidity, 334.875),
            // },
          ])
        );
      } else {
        const [specialPool, pool1, pool2, pool3, pool4, pool5] =
          await Promise.all([
            RGPSpecialPool(RGPSPECIALPOOLADDRESSES[chainId as number], library),
            smartSwapLPTokenPoolOne(
              SMARTSWAPLP_TOKEN1ADDRESSES[chainId as number],
              library
            ),
            smartSwapLPTokenPoolTwo(
              SMARTSWAPLP_TOKEN2ADDRESSES[chainId as number],
              library
            ),
            smartSwapLPTokenPoolThree(
              SMARTSWAPLP_TOKEN3ADDRESSES[chainId as number],
              library
            ),
            smartSwapLPTokenV2PoolFour(
              SMARTSWAPLP_TOKEN4ADDRESSES[chainId as number],
              library
            ),
            smartSwapLPTokenV2PoolFive(
              SMARTSWAPLP_TOKEN5ADDRESSES[chainId as number],
              library
            ),
          ]);

        const [
          rgpTotalStaking,
          pool1Reserve,
          pool2Reserve,
          pool3Reserve,
          pool4Reserve,
          pool5Reserve,
        ] = await Promise.all([
          await specialPool.totalStaking(),
          pool1.getReserves(),
          pool2.getReserves(),
          pool3.getReserves(),
          pool4.getReserves(),
          pool5.getReserves(),
        ]);
        const RGPprice: number | any = ethers.utils.formatUnits(
          pool1Reserve[0].mul(1000).div(pool1Reserve[1]),
          3
        );

        const BNBprice = getBnbPrice(pool3, pool3Reserve);
        const RGPLiquidity = ethers.utils
          .formatUnits(rgpTotalStaking.mul(Math.floor(1000 * RGPprice)), 21)
          .toString();
        const BUSD_RGPLiquidity = ethers.utils
          .formatEther(pool1Reserve[0].mul(2))
          .toString();

        const RGP_BNBLiquidity = ethers.utils
          .formatUnits(pool2Reserve[0].mul(Math.floor(BNBprice * 1000 * 2)), 21)
          .toString();
        const BUSD_BNBLiquidity = getBusdBnbLiquidity(pool3, pool3Reserve);

        const AXS_BUSDLiquidity = getAXSBUSDLiquidity(pool5, pool5Reserve);
        const AXS_RGPLiquidity = ethers.utils
          .formatUnits(
            pool4Reserve[1].mul(Math.floor(Number(RGPprice) * 1000 * 2)),
            21
          )
          .toString();

        dispatch(
          updateTotalLiquidity([
            {
              deposit: "RGP",
              liquidity: RGPLiquidity,
              apy: calculateApy(RGPprice, RGPLiquidity, 250),
            },
            {
              deposit: "RGP-BNB",
              liquidity: RGP_BNBLiquidity,
              apy: calculateApy(RGPprice, RGP_BNBLiquidity, 953.3333333),
            },
            {
              deposit: "RGP-BUSD",
              liquidity: BUSD_RGPLiquidity,
              apy: calculateApy(RGPprice, BUSD_RGPLiquidity, 3336.666667),
            },
            {
              deposit: "BNB-BUSD",
              liquidity: BUSD_BNBLiquidity,
              apy: calculateApy(RGPprice, BUSD_BNBLiquidity, 476.6666667),
            },
            {
              deposit: "AXS-RGP",
              liquidity: AXS_RGPLiquidity,
              apy: calculateApy(RGPprice, AXS_RGPLiquidity, 715),
            },
            {
              deposit: "AXS-BUSD",
              liquidity: AXS_BUSDLiquidity,
              apy: calculateApy(RGPprice, AXS_BUSDLiquidity, 238.3333333),
            },
          ])
        );
      }
    } catch (error) {
      console.log(error, "get farm data");
      setfarmDataLoading(false);
      //if (!toast.isActive(id)) {
      //  showErrorToast();
    }
    setfarmDataLoading(false);
  };

  const specialPoolStaked = async () => {
    if (account) {
      try {
        const specialPool = await RGPSpecialPool(
          RGPSPECIALPOOLADDRESSES[chainId as number],
          library
        );
        const RGPStakedEarned = await Promise.all([
          await specialPool.userData(account),
          await specialPool.calculateRewards(account),
        ]);
        return RGPStakedEarned;
      } catch (error) {
        return error;
      }
    }
  };
  const getTokenStaked = async () => {
    try {
      if (account && Number(chainId) !== Number(SupportedChainId.POLYGON)) {
        const masterChefV2 = await MasterChefV2Contract(
          MASTERCHEFV2ADDRESSES[chainId as number],
          library
        );
        const [
          poolOneEarned,
          poolTwoEarned,
          poolThreeEarned,
          poolFourEarned,
          poolFiveEarned,
          poolOneStaked,
          poolTwoStaked,
          poolThreeStaked,
          poolFourStaked,
          poolFiveStaked,
        ] = await Promise.all([
          masterChefV2.pendingRigel(1, account),
          masterChefV2.pendingRigel(2, account),
          masterChefV2.pendingRigel(3, account),
          masterChefV2.pendingRigel(4, account),
          masterChefV2.pendingRigel(5, account),
          masterChefV2.userInfo(1, account),
          masterChefV2.userInfo(2, account),
          masterChefV2.userInfo(3, account),
          masterChefV2.userInfo(4, account),
          masterChefV2.userInfo(5, account),
        ]);

        const RGPStakedEarned = await specialPoolStaked();
        let RGPStaked;
        let RGPEarned;

        //console.log("EARRNED", RGPStakedEarned)

        if (RGPStakedEarned) {
          const [specialPoolStaked, specialPoolEarned] = RGPStakedEarned;

          RGPStaked = formatBigNumber(specialPoolStaked.tokenQuantity);
          RGPEarned = formatBigNumber(specialPoolEarned);
        } else {
          RGPStaked = 0;
          RGPEarned = 0;
        }

        dispatch(
          updateTokenStaked([
            { staked: RGPStaked, earned: RGPEarned, symbol: "RGP" },
            {
              staked: formatBigNumber(poolTwoStaked.amount),
              earned: formatBigNumber(poolTwoEarned),
            },
            {
              staked: formatBigNumber(poolOneStaked.amount),
              earned: formatBigNumber(poolOneEarned),
            },
            {
              staked: formatBigNumber(poolThreeStaked.amount),
              earned: formatBigNumber(poolThreeEarned),
            },
            {
              staked: formatBigNumber(poolFourStaked.amount),
              earned: formatBigNumber(poolFourEarned),
            },
            {
              staked: formatBigNumber(poolFiveStaked.amount),
              earned: formatBigNumber(poolFiveEarned),
            },
          ])
        );

        setInitialLoad(false);
      }
      if (account && Number(chainId) === Number(SupportedChainId.POLYGON)) {
        const masterChefV2 = await MasterChefV2Contract(
          MASTERCHEFV2ADDRESSES[chainId as number],
          library
        );
        const [
          poolOneEarned,
          poolTwoEarned,
          poolThreeEarned,
          // poolFourEarned,
          // poolFiveEarned,
          poolOneStaked,
          poolTwoStaked,
          poolThreeStaked,
          // poolFourStaked,
          // poolFiveStaked,
        ] = await Promise.all([
          masterChefV2.pendingRigel(1, account),
          masterChefV2.pendingRigel(2, account),
          masterChefV2.pendingRigel(3, account),
          // masterChefV2.pendingRigel(4, account),
          // masterChefV2.pendingRigel(5, account),
          masterChefV2.userInfo(1, account),
          masterChefV2.userInfo(2, account),
          masterChefV2.userInfo(3, account),
          // masterChefV2.userInfo(4, account),
          // masterChefV2.userInfo(5, account),
        ]);

        //console.log("poolFourStaked", poolFourStaked)
        // const RGPStakedEarned = await specialPoolStaked();
        // let RGPStaked;
        // let RGPEarned;

        // console.log("EARRNED", RGPStakedEarned)

        // if (RGPStakedEarned) {
        // const [specialPoolStaked, specialPoolEarned] = await RGPStakedEarned;

        // RGPStaked = formatBigNumber(specialPoolStaked.tokenQuantity);
        // RGPEarned = formatBigNumber(specialPoolEarned);
        // } else {
        // RGPStaked = 0;
        // RGPEarned = 0;
        // }

        dispatch(
          updateTokenStaked([
            { staked: 0, earned: 0 },
            {
              staked: formatBigNumber(poolOneStaked.amount),
              earned: formatBigNumber(poolOneEarned),
            },
            {
              staked: formatBigNumber(poolTwoStaked.amount),
              earned: formatBigNumber(poolTwoEarned),
            },
            {
              staked: formatBigNumber(poolThreeStaked.amount),
              earned: formatBigNumber(poolThreeEarned),
            },
            // {
            //   staked: formatBigNumber(poolFourStaked.amount),
            //   earned: formatBigNumber(poolFourEarned),
            // },
            // {
            //   staked: formatBigNumber(poolFiveStaked.amount),
            //   earned: formatBigNumber(poolFiveEarned),
            // },
          ])
        );

        setInitialLoad(false);
      }
    } catch (error) {
      console.error(error, "getTokenStaked =>Farming v2");
    }
  };

  const calculateApy = (rgpPrice: any, totalLiquidity: any, inflation: any) =>
    (rgpPrice * inflation * 365 * 100) / totalLiquidity;

  const getBusdBnbLiquidity = (pool3: any, pool3Reserve: any) => {
    const pool3Testnet = "0x120f3E6908899Af930715ee598BE013016cde8A5";
    let BUSD_BNBLiquidity;
    if (pool3 && pool3.address === pool3Testnet) {
      BUSD_BNBLiquidity = ethers.utils
        .formatEther(pool3Reserve[0].mul(2))
        .toString();
    } else {
      BUSD_BNBLiquidity = ethers.utils
        .formatEther(pool3Reserve[1].mul(2))
        .toString();
    }
    return BUSD_BNBLiquidity;
  };

  const getBnbPrice = (pool3: any, pool3Reserve: any): number => {
    const pool3testnet = "0x120f3E6908899Af930715ee598BE013016cde8A5";
    let BNBprice;
    if (pool3 && pool3.address === pool3testnet) {
      BNBprice = ethers.utils.formatUnits(
        pool3Reserve[0].mul(1000).div(pool3Reserve[1]),
        3
      );
    } else {
      BNBprice = ethers.utils.formatUnits(
        pool3Reserve[1].mul(1000).div(pool3Reserve[0]),
        3
      );
    }
    return Number(BNBprice);
  };

  const getAXSBUSDLiquidity = (pool5: any, pool5Reserve: any) => {
    const pool5Testnet = "0x816b823d9C7F30327B2c626DEe4aD731Dc9D3641";
    let AXS_BUSDLiquidity;
    // BUSD is token0 on testnet but token1 on mainnet, thus the reason to check
    // before calculating the liquidity based on BUSD
    if (pool5 && pool5.address === pool5Testnet) {
      AXS_BUSDLiquidity = ethers.utils
        .formatEther(pool5Reserve[0].mul(2))
        .toString();
    } else {
      AXS_BUSDLiquidity = ethers.utils
        .formatEther(pool5Reserve[1].mul(2))
        .toString();
    }
    return AXS_BUSDLiquidity;
  };

  return (
    <Box>
      {(chainId && library) || !showAlert ? null : (
        <Box mx={[5, 10, 15, 20]} my={4}>
          <Alert
            color="#FFFFFF"
            background={mode === DARK_THEME ? "#319EF6" : "#319EF6"}
            borderRadius="8px"
          >
            <AlertSvg />
            <AlertDescription
              fontFamily="Inter"
              fontSize={{ base: "16px", md: "18px", lg: "20px" }}
              fontWeight="500"
              lineHeight="24px"
              letterSpacing="0em"
              textAlign="left"
              padding="10px"
            >
              This is the V2 Farm. You should migrate your stakings from V1
              Farm.
            </AlertDescription>

            <CloseButton
              position="absolute"
              margin="2px"
              height="14px"
              width="14px"
              background="#319EF6"
              color="#fff"
              right="20px"
              textAign="center"
              onClick={handleAlert}
            />
          </Alert>
        </Box>
      )}

      <Flex justifyContent='flex-end'>
        <Link
          href='https://docs.google.com/forms/d/e/1FAIpQLSdJGAuABrJd6d0WSprUWB140we9hGqa-IwIbonx9ZJhxN2zsg/viewform'
          position={{ base: "relative", md: "absolute" }}
          isExternal
        >
          <Button
            background='#4CAFFF'
            boxShadow='0px 4px 6px -4px rgba(24, 39, 75, 0.12), 0px 8px 8px -4px rgba(24, 39, 75, 0.08)'
            borderRadius='6px'
            mx={[5, 10, 15, 20]}
            padding=' 12px 32px'
            mt={3}
            variant='brand'
          >
            List your project
          </Button>
        </Link>
      </Flex>
      <Tabs
        defaultIndex={match ? STAKING_INDEX : LIQUIDITY_INDEX}
        index={tabIndex}
        onChange={handleTabsChange}
        // isManual
        variant="enclosed"
        mx={[5, 10, 15, 20]}
        my={4}
        isFitted={isMobileDevice ? true : false}
      >

        <TabList borderBottom={0}>
          <Tab
            isDisabled={switchTab}
            display="flex"
            flex-direction="row"
            justify-content="center"
            align-items="center"
            flexWrap={isMobileDevice ? "wrap" : undefined}
            padding="4px 12px"
            border="1px solid #DEE5ED !important"
            borderRadius="10px 0px 0px 10px"
            background={
              mode === LIGHT_THEME && selected === STAKING
                ? "#FFFFFF !important"
                : mode === DARK_THEME && selected === LIQUIDITY
                ? "#213345 !important"
                : mode === DARK_THEME && selected === STAKING
                ? "#15202B !important"
                : mode === LIGHT_THEME && selected === LIQUIDITY
                ? "#DEE5ED !important"
                : "#DEE5ED !important"
            }
            // px={5}
            // py={4}
            // minWidth={{ base: "none", md: "200px", lg: "200px" }}
            value={LIQUIDITY}
            onClick={() => handleSelect(LIQUIDITY)}
            borderColor={
              mode === LIGHT_THEME && selected === LIQUIDITY
                ? "#F2F5F8 !important"
                : mode === DARK_THEME && selected === LIQUIDITY
                ? "#324D68 !important"
                : mode === DARK_THEME && selected === STAKING
                ? "#324D68 !important"
                : mode === LIGHT_THEME && selected === STAKING
                ? "#F2F5F8 !important"
                : "#F2F5F8 !important"
            }
          >
            <Text
              color={
                mode === LIGHT_THEME && selected === LIQUIDITY
                  ? "#333333"
                  : mode === DARK_THEME && selected === LIQUIDITY
                  ? "#F1F5F8"
                  : mode === DARK_THEME && selected === STAKING
                  ? "#F1F5F8"
                  : mode === LIGHT_THEME && selected === STAKING
                  ? "#333333"
                  : "#333333"
              }
              fontSize={isMobileDevice ? "14px" : undefined}
              mt="2"
            >
              Liquidity Pools
            </Text>
            {Number(chainId) === Number(SupportedChainId.POLYGON) ? null : (
              <Select
                borderColor={
                  mode === LIGHT_THEME && selected === LIQUIDITY
                    ? "#F2F5F8 !important"
                    : mode === DARK_THEME && selected === LIQUIDITY
                    ? "#324D68 !important"
                    : mode === DARK_THEME && selected === STAKING
                    ? "#324D68 !important"
                    : mode === LIGHT_THEME && selected === STAKING
                    ? "#F2F5F8 !important"
                    : "#F2F5F8 !important"
                }
                color={
                  mode === LIGHT_THEME && selected === LIQUIDITY
                    ? "#333333"
                    : mode === DARK_THEME && selected === LIQUIDITY
                    ? "#F1F5F8"
                    : mode === DARK_THEME && selected === STAKING
                    ? "#F1F5F8"
                    : mode === LIGHT_THEME && selected === STAKING
                    ? "#333333"
                    : "#333333"
                }
                onChange={handleLiquidityTab}
                background={mode === LIGHT_THEME ? "#f7f7f8" : "#15202B"}
                cursor="pointer"
                border=" 1px solid #008DFF"
                box-sizing="border-box"
                borderRadius="50px"
                /* Inside auto layout */
                width={isMobileDevice ? undefined : "fit-content"}
                flex="none"
                order="1"
                flex-grow="0"
                margin="10px 16px"
              >
                <option value={0}>V2</option>
                <option value={3}>V1</option>
              </Select>
            )}
          </Tab>
          <Tab
            isDisabled={
              !switchTab || Number(chainId) === Number(SupportedChainId.POLYGON)
            }
            display="flex"
            flex-direction="row"
            justify-content="center"
            align-items="center"
            flexWrap={isMobileDevice ? "wrap" : undefined}
            padding="4px 12px"
            borderRadius="0px 0px 0px 0px"
            border="1px solid #DEE5ED"
            background={
              mode === LIGHT_THEME && selected === LIQUIDITY
                ? "#FFFFFF !important"
                : mode === DARK_THEME && selected === STAKING
                ? "#213345 !important"
                : mode === DARK_THEME && selected === LIQUIDITY
                ? "#15202B !important"
                : mode === LIGHT_THEME && selected === STAKING
                ? "#DEE5ED !important"
                : "#DEE5ED !important"
            }
            color={
              mode === LIGHT_THEME && selected === LIQUIDITY
                ? "#333333"
                : mode === DARK_THEME && selected === LIQUIDITY
                ? "#F1F5F8"
                : mode === DARK_THEME && selected === STAKING
                ? "#F1F5F8"
                : mode === LIGHT_THEME && selected === STAKING
                ? "#333333"
                : "#333333"
            }
            borderColor={
              mode === LIGHT_THEME && selected === LIQUIDITY
                ? "#F2F5F8 !important"
                : mode === DARK_THEME && selected === LIQUIDITY
                ? "#324D68 !important"
                : mode === DARK_THEME && selected === STAKING
                ? "#324D68 !important"
                : mode === LIGHT_THEME && selected === STAKING
                ? "#F2F5F8 !important"
                : "#F2F5F8 !important"
            }
            // px={5}
            // py={4}
            // minWidth={{ base: "none", md: "200px", lg: "200px" }}
            onClick={() => handleSelect(STAKING)}
          >
            <Text>Staking</Text>
            {Number(chainId) === Number(SupportedChainId.POLYGON) ? null : (
              <Select
                borderColor={
                  mode === LIGHT_THEME && selected === LIQUIDITY
                    ? "#F2F5F8 !important"
                    : mode === DARK_THEME && selected === LIQUIDITY
                    ? "#324D68 !important"
                    : mode === DARK_THEME && selected === STAKING
                    ? "#324D68 !important"
                    : mode === LIGHT_THEME && selected === STAKING
                    ? "#F2F5F8 !important"
                    : "#F2F5F8 !important"
                }
                cursor="pointer"
                color={
                  mode === LIGHT_THEME && selected === LIQUIDITY
                    ? "#333333"
                    : mode === DARK_THEME && selected === LIQUIDITY
                    ? "#F1F5F8"
                    : mode === DARK_THEME && selected === STAKING
                    ? "#F1F5F8"
                    : mode === LIGHT_THEME && selected === STAKING
                    ? "#333333"
                    : "#333333"
                }
                onChange={handleStakingTab}
                background={mode === LIGHT_THEME ? "#f7f7f8" : "#15202B"}
                /* Dark Mode / Blue / 1 */

                border=" 1px solid #008DFF"
                box-sizing="border-box"
                borderRadius="50px"
                /* Inside auto layout */
                width={isMobileDevice ? undefined : "fit-content"}
                flex="none"
                order="1"
                flex-grow="0"
                margin="10px 16px"
              >
                <option value={1}>V1</option>
                <option value={4}>V2</option>
              </Select>
            )}
          </Tab>
          <Tab
            isDisabled={true}
            borderRadius="0px 10px 10px 0px"
            border="1px solid #DEE5ED"
            background={
              mode === LIGHT_THEME && selected === LIQUIDITY
                ? "#FFFFFF !important"
                : mode === DARK_THEME && selected === STAKING
                ? "#213345 !important"
                : mode === DARK_THEME && selected === LIQUIDITY
                ? "#15202B !important"
                : mode === LIGHT_THEME && selected === STAKING
                ? "#DEE5ED !important"
                : "#DEE5ED !important"
            }
            color={
              mode === LIGHT_THEME && selected === LIQUIDITY
                ? "#333333"
                : mode === DARK_THEME && selected === LIQUIDITY
                ? "#F1F5F8"
                : mode === DARK_THEME && selected === STAKING
                ? "#F1F5F8"
                : mode === LIGHT_THEME && selected === STAKING
                ? "#333333"
                : "#333333"
            }
            borderColor={
              mode === LIGHT_THEME && selected === LIQUIDITY
                ? "#F2F5F8 !important"
                : mode === DARK_THEME && selected === LIQUIDITY
                ? "#324D68 !important"
                : mode === DARK_THEME && selected === STAKING
                ? "#324D68 !important"
                : mode === LIGHT_THEME && selected === STAKING
                ? "#F2F5F8 !important"
                : "#F2F5F8 !important"
            }
            // px={5}
            // py={4}
            // minWidth={{ base: "none", md: "200px", lg: "200px" }}
            // onClick={() => handleSelect(OTHER_FARMS)}
          >
            <Text>Other Farms</Text>
          </Tab>
        </TabList>
        <Divider my="4" />
        <TabPanels padding="0px">
          <TabPanel padding="0px">
            <Flex
              justifyContent="center"
              alignItems="center"
              rounded="lg"
              mb={4}
            >
              <Box
                bg="#120136"
                minHeight="89vh"
                w={["100%", "100%", "100%"]}
                background={
                  mode === LIGHT_THEME && selected === STAKING
                    ? "#FFFFFF !important"
                    : mode === DARK_THEME && selected === LIQUIDITY
                    ? "#15202B !important"
                    : mode === DARK_THEME && selected === STAKING
                    ? "#15202B !important"
                    : mode === LIGHT_THEME && selected === LIQUIDITY
                    ? "#FFFFFF !important"
                    : "#FFFFFF !important"
                }
                rounded="lg"
              >
                <Box mx="auto" w={["100%", "100%", "100%"]} pb="70px">
                  <Flex
                    alignItems="center"
                    justifyContent="space-between"
                    px={4}
                    py={4}
                    background={
                      mode === LIGHT_THEME && selected === LIQUIDITY
                        ? "#F2F5F8  !important"
                        : mode === DARK_THEME && selected === LIQUIDITY
                        ? "#213345"
                        : mode === DARK_THEME && selected === STAKING
                        ? "#213345"
                        : mode === LIGHT_THEME && selected === STAKING
                        ? "#F2F5F8"
                        : "#F2F5F8 !important"
                    }
                    color={
                      mode === LIGHT_THEME && selected === LIQUIDITY
                        ? "#333333"
                        : mode === DARK_THEME && selected === STAKING
                        ? "#F1F5F8"
                        : mode === DARK_THEME && selected === LIQUIDITY
                        ? "#F1F5F8"
                        : mode === LIGHT_THEME && selected === STAKING
                        ? "#333333"
                        : "#333333"
                    }
                    w={["100%", "100%", "100%"]}
                    align="left"
                    border={
                      mode === LIGHT_THEME
                        ? "1px solid #DEE5ED !important"
                        : mode === DARK_THEME
                        ? "1px solid #324D68 !important"
                        : "1px solid #324D68"
                    }
                    display={{ base: "none", md: "flex", lg: "flex" }}
                  >
                    <Text>Deposit</Text>
                    <Text>Earn</Text>
                    <Text>APY</Text>
                    <Text>Total Liquidity</Text>
                    <Text />
                  </Flex>

                  {FarmData.contents.map((content: any, index: number) =>
                    Number(chainId) === Number(SupportedChainId.POLYGON) &&
                    index !== 0 &&
                    index < 4 ? (
                      <YieldFarm
                        farmDataLoading={farmDataLoading}
                        content={content}
                        key={content.pid}
                        wallet={wallet}
                      />
                    ) : index !== 0 &&
                      Number(chainId) !== Number(SupportedChainId.POLYGON) ? (
                      <YieldFarm
                        farmDataLoading={farmDataLoading}
                        content={content}
                        key={content.pid}
                        wallet={wallet}
                      />
                    ) : null
                  )}
                </Box>
              </Box>
            </Flex>
          </TabPanel>
          <TabPanel padding="0px">
            <Flex
              justifyContent="center"
              alignItems="center"
              rounded="lg"
              mb={4}
            >
              <Box
                bg="#120136"
                minHeight="89vh"
                w={["100%", "100%", "100%"]}
                background={
                  mode === LIGHT_THEME
                    ? "#FFFFFF !important"
                    : mode === DARK_THEME
                    ? "#15202B !important"
                    : "#FFFFFF !important"
                }
                rounded="lg"
              >
                <Box mx="auto" w={["100%", "100%", "100%"]} pb="70px">
                  <Flex
                    alignItems="center"
                    justifyContent="space-between"
                    px={4}
                    py={4}
                    background={
                      mode === DARK_THEME
                        ? "#213345"
                        : mode === LIGHT_THEME
                        ? "#F2F5F8"
                        : "#F2F5F8 !important"
                    }
                    color={
                      mode === LIGHT_THEME
                        ? "#333333"
                        : mode === DARK_THEME
                        ? "#F1F5F8"
                        : "#333333"
                    }
                    w={["100%", "100%", "100%"]}
                    align="left"
                    border={
                      mode === LIGHT_THEME
                        ? "1px solid #DEE5ED !important"
                        : mode === DARK_THEME
                        ? "1px solid #324D68 !important"
                        : "1px solid #324D68"
                    }
                    display={{ base: "none", md: "flex", lg: "flex" }}
                  >
                    <Text>Deposit</Text>
                    <Text>Earn</Text>
                    <Text>APY</Text>
                    <Text>Total Liquidity</Text>
                    <Text />
                  </Flex>
                  {FarmData.contents.map((content: any, index: number) =>
                    index === 0 ? (
                      <YieldFarm
                        farmDataLoading={farmDataLoading}
                        content={content}
                        key={content.pid}
                        wallet={wallet}
                      />
                    ) : null
                  )}
                </Box>
              </Box>
            </Flex>
          </TabPanel>
          <TabPanel padding="0px"></TabPanel>
          <TabPanel padding="0px">
            <Flex
              justifyContent="center"
              alignItems="center"
              rounded="lg"
              mb={4}
            >
              <Box
                bg="#120136"
                minHeight="89vh"
                w={["100%", "100%", "100%"]}
                background={
                  mode === LIGHT_THEME && selected === STAKING
                    ? "#FFFFFF !important"
                    : mode === DARK_THEME && selected === LIQUIDITY
                    ? "#15202B !important"
                    : mode === DARK_THEME && selected === STAKING
                    ? "#15202B !important"
                    : mode === LIGHT_THEME && selected === LIQUIDITY
                    ? "#FFFFFF !important"
                    : "#FFFFFF !important"
                }
                rounded="lg"
              >
                <Box mx="auto" w={["100%", "100%", "100%"]} pb="70px">
                  <Flex
                    alignItems="center"
                    justifyContent="space-between"
                    px={4}
                    py={4}
                    background={
                      mode === LIGHT_THEME && selected === LIQUIDITY
                        ? "#F2F5F8  !important"
                        : mode === DARK_THEME && selected === LIQUIDITY
                        ? "#213345"
                        : mode === DARK_THEME && selected === STAKING
                        ? "#213345"
                        : mode === LIGHT_THEME && selected === STAKING
                        ? "#F2F5F8"
                        : "#F2F5F8 !important"
                    }
                    color={
                      mode === LIGHT_THEME && selected === LIQUIDITY
                        ? "#333333"
                        : mode === DARK_THEME && selected === STAKING
                        ? "#F1F5F8"
                        : mode === DARK_THEME && selected === LIQUIDITY
                        ? "#F1F5F8"
                        : mode === LIGHT_THEME && selected === STAKING
                        ? "#333333"
                        : "#333333"
                    }
                    w={["100%", "100%", "100%"]}
                    align="left"
                    border={
                      mode === LIGHT_THEME
                        ? "1px solid #DEE5ED !important"
                        : mode === DARK_THEME
                        ? "1px solid #324D68 !important"
                        : "1px solid #324D68"
                    }
                    display={{ base: "none", md: "flex", lg: "flex" }}
                  >
                    <Text>
                      Please Migrate your LP token farming from farming V1 to
                      this V2
                    </Text>
                  </Flex>

                  <Button
                    onClick={() => goToV1(LIQUIDITY_INDEX)}
                    background="#4CAFFF"
                    boxShadow="0px 4px 6px -4px rgba(24, 39, 75, 0.12), 0px 8px 8px -4px rgba(24, 39, 75, 0.08)"
                    borderRadius="6px"
                    mx={[5, 10, 15, 20]}
                    position={{ base: "relative", md: "absolute" }}
                    padding=" 12px 32px"
                    mt={3}
                    variant="brand"
                  >
                    Go to farming V1
                  </Button>
                </Box>
              </Box>
            </Flex>
          </TabPanel>
          <TabPanel padding="0px"></TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default Index;
